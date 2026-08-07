"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  FolderOpen,
  ShieldCheck,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOCUMENT_TYPES, DOCUMENT_LABELS } from "@/lib/constants";
import type { DocumentDto } from "@/lib/types";
import { deleteDocument, toggleReusable } from "@/server/actions/documents";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsVault({ documents }: { documents: DocumentDto[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState("other");
  const [toDelete, setToDelete] = useState<DocumentDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong.");
      }
      router.refresh();
    });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      toast.success("Uploaded to your vault");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="label-mono text-muted-foreground">Vault</p>
          <h1 className="mt-1 font-display text-3xl font-light tracking-tight">Documents</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your secure vault. Upload once, reuse across applications.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-44">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger aria-label="Document type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-1.5 h-4 w-4" />}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                handleUpload(f);
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="mt-10 flex flex-col items-center border px-5 py-16 text-center">
          <span className="grid h-10 w-10 place-items-center border text-muted-foreground">
            <FolderOpen className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-medium">No documents yet</h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Upload your CV, passport or transcript once, and reuse it across every application.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-4 bg-card px-4 py-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center border text-muted-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  {doc.verified && (
                    <span className="label-mono inline-flex items-center gap-1 border border-primary/30 bg-primary/5 text-primary">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {DOCUMENT_LABELS[doc.type] ?? doc.type}
                  {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ""}
                  {doc.isReusable ? " · reusable" : ""}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={pending}
                onClick={() => run(() => toggleReusable(doc.id))}
              >
                <Repeat className="mr-1.5 h-3.5 w-3.5" />
                {doc.isReusable ? "Reusable" : "Make reusable"}
              </Button>

              {doc.url && (
                <Button variant="ghost" size="sm" className="shrink-0" asChild>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    View
                  </a>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${doc.name}`}
                onClick={() => setToDelete(doc)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              &ldquo;{toDelete?.name}&rdquo; will be removed from your vault. Applications already using a copy are
              not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                const doc = toDelete;
                setToDelete(null);
                if (doc) run(() => deleteDocument(doc.id));
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
