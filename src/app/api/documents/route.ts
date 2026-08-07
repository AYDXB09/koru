import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { recomputeCompletion } from "@/server/actions/applications";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
]);

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form." }, { status: 400 });
  }

  const file = form.get("file");
  const applicationId = String(form.get("applicationId") ?? "");
  const type = String(form.get("type") ?? "other");
  const isReusable = form.get("isReusable") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds the 10MB limit." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "File type not supported. Upload PDF, DOC(X), XLS(X), JPG, PNG or TXT." }, { status: 400 });
  }

  if (applicationId) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId: user.id },
    });
    if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const { url } = await storage.put({ name: file.name, type: file.type, size: file.size, buffer });

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      applicationId: applicationId || null,
      name: file.name,
      type: type || "other",
      url,
      fileType: file.type,
      fileSize: file.size,
      isReusable: isReusable && !applicationId,
    },
  });

  if (applicationId) await recomputeCompletion(applicationId);

  return NextResponse.json({
    ok: true,
    document: {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      url: doc.url,
      fileSize: doc.fileSize,
      isReusable: doc.isReusable,
    },
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
