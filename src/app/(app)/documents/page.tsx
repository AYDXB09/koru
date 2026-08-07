import { getUserDocuments } from "@/server/queries";
import { requireUser } from "@/lib/auth";
import { DocumentsVault } from "@/components/documents/vault";

export const metadata = { title: "Documents · Koru" };

export default async function DocumentsPage() {
  const user = await requireUser();
  const documents = await getUserDocuments(user.id);

  return <DocumentsVault documents={documents} />;
}
