import { notFound } from "next/navigation";
import { getApplicationDetail, getUserDocuments } from "@/server/queries";
import { requireUser } from "@/lib/auth";
import { evaluateEligibility } from "@/lib/eligibility";
import { profileLike } from "@/server/serializers";
import { ApplicationWorkspace } from "@/components/application/workspace";
import { prisma } from "@/lib/db";

export const metadata = { title: "Application workspace · Koru" };

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const application = await getApplicationDetail(id, user.id);
  if (!application) notFound();

  const [vaultDocs, profile] = await Promise.all([
    getUserDocuments(user.id),
    prisma.profile.findUnique({ where: { userId: user.id } }),
  ]);

  const eligibility = evaluateEligibility(
    profile ? profileLike(profile) : {},
    application.rules,
  );

  return (
    <ApplicationWorkspace
      application={{
        id: application.id,
        status: application.status,
        completion: application.completion,
        notes: application.notes,
        startedAt: application.startedAt,
        updatedAt: application.updatedAt,
        opportunity: {
          id: application.opportunity.id,
          title: application.opportunity.title,
          providerName: application.opportunity.providerName,
          deadline: application.opportunity.deadline,
          isRolling: application.opportunity.isRolling,
          applicationUrl: application.opportunity.applicationUrl,
          category: application.opportunity.category,
          estimatedHours: application.opportunity.estimatedHours,
          stages: application.opportunity.stages,
        },
        rules: application.rules,
        tasks: application.tasks,
        documents: application.documents,
      }}
      vaultDocuments={vaultDocs.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        url: d.url,
      }))}
      eligibility={eligibility}
    />
  );
}
