import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  txt: "text/plain",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { key } = await params;
  const fileName = key[key.length - 1] ?? "";
  const urlPath = `/api/files/${encodeURIComponent(fileName)}`;

  const doc = await prisma.document.findFirst({
    where: { userId: user.id, url: { endsWith: urlPath } },
  });
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storage = getStorage();
  const file = await storage.get(fileName);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = file.type || CONTENT_TYPES[ext] || "application/octet-stream";

  return new NextResponse(file.data as unknown as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${doc.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
