"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { recomputeCompletion } from "@/server/actions/applications";

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findFirst({ where: { id: documentId, userId: user.id } });
  if (!doc) throw new Error("Document not found.");

  if (doc.url?.startsWith("/api/files/")) {
    const key = decodeURIComponent(doc.url.split("/").pop() ?? "");
    await getStorage().remove(key).catch(() => undefined);
  }
  await prisma.document.delete({ where: { id: documentId } });

  if (doc.applicationId) await recomputeCompletion(doc.applicationId);
  revalidatePath(doc.applicationId ? `/applications/${doc.applicationId}` : "/documents");
  revalidatePath("/documents");
}

export async function toggleReusable(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findFirst({ where: { id: documentId, userId: user.id } });
  if (!doc) throw new Error("Document not found.");
  await prisma.document.update({
    where: { id: documentId },
    data: { isReusable: !doc.isReusable },
  });
  revalidatePath("/documents");
}

/** Attach a reusable vault document to an application (documents reused). */
export async function attachDocumentToApplication(applicationId: string, documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id, applicationId: null },
  });
  if (!doc) throw new Error("Document not found in your vault.");
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
  if (!app) throw new Error("Application not found.");

  await prisma.document.update({
    where: { id: documentId },
    data: { applicationId },
  });
  await recomputeCompletion(applicationId);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/documents");
}

/** Duplicate a vault document into an application (keeps the vault copy). */
export async function copyDocumentToApplication(applicationId: string, documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id, applicationId: null },
  });
  if (!doc) throw new Error("Document not found in your vault.");
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
  if (!app) throw new Error("Application not found.");

  const existing = await prisma.document.findFirst({
    where: { applicationId, name: doc.name },
  });
  if (!existing) {
    await prisma.document.create({
      data: {
        userId: user.id,
        applicationId,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        isReusable: false,
      },
    });
    await recomputeCompletion(applicationId);
  }
  revalidatePath(`/applications/${applicationId}`);
}
