import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Document storage abstraction.
 * Local disk by default (dev); Supabase Storage REST when env vars are set.
 * Uploaded files are served by the /api/files/[...key] route handler.
 */

export interface StoredFile {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
}

export interface StorageBackend {
  readonly name: string;
  put(file: StoredFile): Promise<{ key: string; url: string }>;
  get(key: string): Promise<{ data: Buffer; type: string } | null>;
  remove(key: string): Promise<void>;
  signedUrl(key: string): string;
}

const uploadsRoot = path.join(process.cwd(), ".koru-uploads");

class LocalStorage implements StorageBackend {
  readonly name = "local";

  async put(file: StoredFile) {
    const key = `${randomUUID()}${path.extname(file.name)}`;
    const dir = path.join(uploadsRoot, "files");
    await fs.mkdir(dir, { recursive: true });
    const abs = path.join(dir, key);
    await fs.writeFile(abs, file.buffer);
    return { key, url: this.signedUrl(key) };
  }

  async get(key: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) return null;
    const abs = path.join(uploadsRoot, "files", key);
    try {
      const data = await fs.readFile(abs);
      return { data, type: "" };
    } catch {
      return null;
    }
  }

  async remove(key: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) return;
    await fs.rm(path.join(uploadsRoot, "files", key), { force: true });
  }

  signedUrl(key: string) {
    return `/api/files/${encodeURIComponent(key)}`;
  }
}

class SupabaseStorage implements StorageBackend {
  readonly name = "supabase";
  private baseUrl: string;
  private bucket: string;

  constructor() {
    this.baseUrl = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
    this.bucket = process.env.SUPABASE_BUCKET ?? "koru-documents";
  }

  get available() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      "Content-Type": "application/json",
    };
  }

  async put(file: StoredFile) {
    if (!this.available) throw new Error("Supabase storage is not configured.");
    const key = `${randomUUID()}${path.extname(file.name)}`;
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: new Uint8Array(file.buffer),
    });
    if (!res.ok) throw new Error(`Supabase upload failed (${res.status})`);
    return { key, url: this.signedUrl(key) };
  }

  async get(key: string) {
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`, {
      headers: this.headers(),
    });
    if (!res.ok) return null;
    return { data: Buffer.from(await res.arrayBuffer()), type: res.headers.get("content-type") ?? "" };
  }

  async remove(key: string) {
    if (!this.available) return;
    await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`, {
      method: "DELETE",
      headers: this.headers(),
    });
  }

  signedUrl(key: string) {
    return `/api/files/${encodeURIComponent(key)}`;
  }
}

let cached: StorageBackend | null = null;

export function getStorage(): StorageBackend {
  if (cached) return cached;
  const supabase = new SupabaseStorage();
  cached = supabase.available ? supabase : new LocalStorage();
  return cached;
}

/** Local path used by the file-serving route. */
export function localFileDir() {
  return path.join(uploadsRoot, "files");
}
