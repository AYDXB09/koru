import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  CalendarClock,
  Clock,
  BadgeCheck,
  FileText,
  MapPin,
  ListOrdered,
  CircleHelp,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getOpportunityBySlug,
  getOpportunityRules,
  profileForEngine,
} from "@/server/queries";
import { evaluateEligibility } from "@/lib/eligibility";
import { assessFit } from "@/lib/matching";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { CATEGORY_LABELS } from "@/lib/types";
import { deadlineLabel, classifyUrgency, URGENCY_LABEL } from "@/lib/deadlines";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EligibilityPanel } from "@/components/opportunities/eligibility-panel";
import { AiPanel } from "@/components/opportunities/ai-panel";
import { ScoreRing } from "@/components/shared/score";
import { startApplication } from "@/server/actions/applications";
import { cn } from "@/lib/utils";

export const metadata = { title: "Opportunity" };

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) notFound();

  const [rules, profile] = await Promise.all([
    getOpportunityRules(opportunity.id),
    profileForEngine(user.id),
  ]);

  const eligibility = evaluateEligibility(profile ?? {}, rules);
  const fit = assessFit(
    opportunity.category,
    profile?.fundingInterests ?? [],
    eligibility,
    opportunity.difficulty,
  );

  const existing = await prisma.application.findUnique({
    where: { userId_opportunityId: { userId: user.id, opportunityId: opportunity.id } },
    select: { id: true },
  });

  const urgency = classifyUrgency(opportunity.deadline);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All opportunities
      </Link>

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="label-mono text-primary">
              {CATEGORY_LABELS[opportunity.category] ?? opportunity.category}
            </span>
            <span className="h-1 w-1 bg-primary/40" />
            <span className="label-mono text-muted-foreground">
              {DIFFICULTY_LABELS[opportunity.difficulty]}
            </span>
            {opportunity.providerVerified && (
              <>
                <span className="h-1 w-1 bg-primary/40" />
                <span className="label-mono inline-flex items-center gap-1 text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified source
                </span>
              </>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-light leading-tight tracking-tight md:text-4xl">
            {opportunity.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">by {opportunity.providerName}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <ScoreRing value={fit.fitScore} size={76} stroke={6} label="Fit score" />
          <p className="label-mono text-muted-foreground">Personal fit</p>
        </div>
      </div>

      {/* Meta strip */}
      <div className="mt-6 grid grid-cols-2 gap-px border bg-border md:grid-cols-4">
        <MetaTile
          icon={<CalendarClock className="h-[18px] w-[18px]" />}
          label="Deadline"
          value={opportunity.isRolling ? "Rolling" : deadlineLabel(opportunity.deadline)}
          tone={urgency === "urgent" ? "danger" : "default"}
        />
        <MetaTile
          icon={<Clock className="h-[18px] w-[18px]" />}
          label="Estimated effort"
          value={`~${opportunity.estimatedHours} hours`}
        />
        <MetaTile
          icon={<FileText className="h-[18px] w-[18px]" />}
          label="Documents"
          value={`${opportunity.requiredDocuments.length} required`}
        />
        <MetaTile
          icon={<MapPin className="h-[18px] w-[18px]" />}
          label="Scope"
          value={opportunity.countryScope}
        />
      </div>

      {opportunity.fundingAmount && (
        <p className="mt-4 font-display text-lg font-medium text-primary">
          {opportunity.fundingAmount} {opportunity.currency}
        </p>
      )}

      {/* CTA */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {existing ? (
          <Button asChild>
            <Link href={`/applications/${existing.id}`}>
              Open application workspace <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <form action={startApplication.bind(null, opportunity.id)}>
            <Button type="submit" size="lg" className="gap-2">
              Start application
            </Button>
          </form>
        )}
        {opportunity.applicationUrl && (
          <Button variant="outline" asChild>
            <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer">
              Official portal <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        {urgency !== "none" && (
          <span className={cn("text-xs", urgency === "urgent" ? "text-destructive" : "text-muted-foreground")}>
            {URGENCY_LABEL[urgency]}
          </span>
        )}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        <div className="space-y-10 lg:col-span-3">
          <section>
            <h2 className="font-display text-xl font-medium">About this opportunity</h2>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {opportunity.description}
            </p>
          </section>

          {opportunity.requiredDocuments.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-medium">Required documents</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {opportunity.requiredDocuments.map((doc) => (
                  <li key={doc} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {doc}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {opportunity.stages.length > 0 && (
            <section>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-medium">Application stages</h2>
                <ListOrdered className="h-[18px] w-[18px] text-primary" />
              </div>
              <ol className="mt-3 divide-y border">
                {[...opportunity.stages]
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => (
                    <li key={stage.order} className="flex gap-4 px-4 py-3">
                      <span className="label-mono grid h-6 w-6 shrink-0 place-items-center border border-primary/40 text-primary">
                        {stage.order}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{stage.name}</p>
                        {stage.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            </section>
          )}

          {opportunity.faq.length > 0 && (
            <section>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-medium">Frequently asked</h2>
                <CircleHelp className="h-[18px] w-[18px] text-primary" />
              </div>
              <div className="mt-3 space-y-2">
                {opportunity.faq.map((item, i) => (
                  <Collapsible key={i}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/60">
                      {item.question}
                      <span className="text-primary">+</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border border-t-0 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </section>
          )}

          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Eligibility, deadlines and funding are based on the official page
              {opportunity.officialUrl && (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={opportunity.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                  >
                    view source <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
              . Always confirm on the provider&apos;s site before submitting.
            </span>
          </div>
        </div>

        <div className="space-y-10 lg:col-span-2">
          <EligibilityPanel result={eligibility} />
          <AiPanel opportunityId={opportunity.id} applicationId={existing?.id} />
        </div>
      </div>
    </div>
  );
}

function MetaTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="label-mono">{label}</span>
      </div>
      <p className={cn("mt-2 text-sm font-medium", tone === "danger" && "text-destructive")}>{value}</p>
    </div>
  );
}
