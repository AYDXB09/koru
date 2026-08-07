import { requireUser } from "@/lib/auth";
import { getOpportunityFits } from "@/server/queries";
import { OpportunitiesFeed } from "@/components/opportunities/feed";

export const metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
  const user = await requireUser();
  const opportunities = await getOpportunityFits(user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="label-mono text-muted-foreground">Discovery</p>
          <h1 className="mt-1 font-display text-3xl font-light tracking-tight">Opportunities</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Grants, scholarships, fellowships and funding for Fiji, ranked by how well they fit your profile.
          </p>
        </div>
        <p className="label-mono text-primary">{opportunities.length} indexed</p>
      </div>
      <OpportunitiesFeed opportunities={opportunities} />
    </div>
  );
}
