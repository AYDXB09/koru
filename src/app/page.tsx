import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, FileText, Waves, Bell, Landmark, RefreshCw } from "lucide-react";
import { optionalUser } from "@/lib/auth";
import { getLandingStats, getLandingLedger } from "@/server/queries";
import { KoruMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CountUp } from "@/components/shared/count-up";
import { Reveal } from "@/components/shared/reveal";
import { CATEGORY_LABELS } from "@/lib/types";
import type { OpportunityCategory } from "@/lib/types";

function fijiEdition() {
  const date = new Date();
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Pacific/Fiji", weekday: "long" }).format(date);
  const dateStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Pacific/Fiji", day: "numeric", month: "long", year: "numeric" }).format(date);
  return { day, dateStr };
}

const TICKER_ORDER = [
  "scholarship",
  "startup-funding",
  "climate-grant",
  "community-grant",
  "fellowship",
  "research-grant",
  "competition",
  "business-support",
  "professional-development",
  "travel-grant",
  "job",
] as const;

export default async function LandingPage() {
  const user = await optionalUser();
  if (user) redirect("/dashboard");

  const [stats, ledger] = await Promise.all([getLandingStats(), getLandingLedger(4)]);
  const { day, dateStr } = fijiEdition();

  const countByCategory = new Map(stats.byCategory.map((c) => [c.category, c._count._all]));
  const tickerItems = TICKER_ORDER.map((c) => ({
    label: CATEGORY_LABELS[c as OpportunityCategory] ?? c,
    count: countByCategory.get(c) ?? 0,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Masthead */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <KoruMark className="h-7 w-7 text-primary" />
            <span className="font-display text-lg font-medium tracking-tight">Koru</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild>
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="tide-paper paper-grain">
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-y py-2">
            <p className="label-mono text-muted-foreground">
              {day} · {dateStr}
            </p>
            <p className="label-mono flex items-center gap-2 text-muted-foreground">
              <span className="live-dot" aria-hidden="true" /> the index updates on its own
            </p>
            <p className="label-mono text-primary">Nº <CountUp value={stats.total} /></p>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-14 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:pt-20">
          <Reveal>
            <p className="label-mono text-primary">The funding OS for Fiji</p>
            <h1 className="mt-5 font-display text-[2.9rem] font-light leading-[1.02] tracking-tight md:text-[5.25rem]">
              Grants and scholarships,
              <br />
              <em className="font-light text-accent underline decoration-accent/40 decoration-[3px] underline-offset-8">
                finished
              </em>{" "}
              not just found.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Koru reads every open fund, scholarship and fellowship in the region, matches them to who you
              are, and walks each application to the final submit button. The paperwork you hate is the
              paperwork we handle.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login">
                  Find your funding <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">Free for Fijians. No card.</p>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t pt-6 sm:grid-cols-4">
              <div>
                <dt className="sr-only">Live opportunities indexed</dt>
                <dd className="font-display text-4xl font-light tabular tracking-tight text-primary">
                  <CountUp value={stats.total} />
                </dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">live opportunities</dd>
              </div>
              <div>
                <dt className="sr-only">Funders</dt>
                <dd className="font-display text-4xl font-light tabular tracking-tight">
                  <CountUp value={stats.providers} />
                </dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">funders indexed</dd>
              </div>
              <div>
                <dt className="sr-only">Funding types</dt>
                <dd className="font-display text-4xl font-light tabular tracking-tight">
                  <CountUp value={stats.byCategory.length} />
                </dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">funding types</dd>
              </div>
              <div>
                <dt className="sr-only">Closing within 30 days</dt>
                <dd className="font-display text-4xl font-light tabular tracking-tight text-accent">
                  <CountUp value={stats.closingSoon} />
                </dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">close in 30 days</dd>
              </div>
            </dl>
          </Reveal>

          {/* Hero panel — today's ledger, live rows */}
          <Reveal delay={140} className="self-center">
            <div className="border bg-card paper-grain">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <p className="label-mono flex items-center gap-2 text-muted-foreground">
                  <span className="live-dot" aria-hidden="true" /> Today&apos;s ledger
                </p>
                <span className="label-mono text-primary">Nº {stats.total}</span>
              </div>
              <ul className="ledger-rule">
                {ledger.map((o, i) => (
                  <li
                    key={o.id}
                    className="group flex items-center gap-4 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/60"
                  >
                    <span className="tabular w-6 shrink-0 font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center border text-primary">
                      <Compass className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[15px] font-medium">{o.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.providerName} · {CATEGORY_LABELS[o.category as OpportunityCategory] ?? o.category}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-primary">
                        {o.isRolling ? "Rolling" : o.fundingAmount || "Open"}
                      </p>
                      <p className={`mt-0.5 text-[11px] ${o.daysLeft !== null && o.daysLeft <= 14 ? "font-medium text-accent" : "text-muted-foreground"}`}>
                        {o.isRolling ? "apply any time" : o.daysLeft !== null ? `${o.daysLeft} ${o.daysLeft === 1 ? "day" : "days"} left` : "open"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="label-mono text-muted-foreground">{stats.rolling} rolling · {stats.closingSoon} closing in 30 days</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 text-primary" /> live rows, not sample data
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Ticker */}
        <div className="overflow-hidden border-t">
          <div className="marquee-track gap-10 py-3.5">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                <span className="label-mono text-muted-foreground">
                  {t.label} · <span className="text-primary">{t.count}</span>
                </span>
                <span className="h-1.5 w-1.5 bg-accent/70" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <p className="label-mono text-primary">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-light tracking-tight md:text-4xl">
                From discovery to submitted, in one place
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Fill in your profile once. Koru does the searching, matching, planning and reminding, and keeps
                the feed current on its own.
              </p>
            </div>
          </Reveal>

          <ol className="mt-12 grid gap-px border md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Koru matches you",
                body: "A feed of grants, scholarships and fellowships, ranked by how likely you are to qualify. Sources are pulled automatically and checked against official pages.",
              },
              {
                step: "02",
                title: "An application, unpacked",
                body: "Each opportunity becomes a workspace. Eligibility rules read line by line, a task plan generated from the official requirements, documents at hand.",
              },
              {
                step: "03",
                title: "You finish",
                body: "Deadline countdowns, reminders at 14, 7, 3 and 1 day out, and a completion score that tells you when you are ready to submit.",
              },
            ].map((f, i) => (
              <Reveal key={f.step} as="li" delay={i * 90}>
                <div className="group h-full bg-card p-7 transition-colors hover:bg-muted/60">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-5xl font-light text-primary/25 transition-colors group-hover:text-primary/60">
                      {f.step}
                    </span>
                    <span className="h-px w-10 bg-accent/60" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-medium">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Browse the catalogue */}
      <section className="relative overflow-hidden border-t bg-card/40">
        <span
          aria-hidden="true"
          className="ghost-num pointer-events-none absolute -top-10 right-[-0.15em] select-none text-[22rem] opacity-40 md:text-[30rem]"
        >
          {stats.total}
        </span>
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <p className="label-mono text-primary">Browse the catalogue</p>
              <h2 className="mt-3 font-display text-3xl font-light tracking-tight md:text-4xl">
                <CountUp value={stats.total} /> live opportunities, ranked by fit
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Grants, scholarships, fellowships, competitions, jobs. A national index that refills itself
                on a schedule and marks each row official, partner or community.
              </p>
            </Reveal>
            <Button variant="outline" asChild>
              <Link href="/login">
                See them all <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px border bg-border md:grid-cols-3 lg:grid-cols-4">
            {stats.byCategory
              .slice()
              .sort((a, b) => b._count._all - a._count._all)
              .map((c, i) => (
                <Reveal
                  key={c.category}
                  delay={Math.min(i, 7) * 45}
                  className="group flex items-center justify-between bg-background p-5 transition-colors hover:bg-muted/60"
                >
                  <span className="flex items-center gap-3">
                    <span className="tabular font-mono text-[10px] text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-[15px] font-medium leading-tight">
                      {CATEGORY_LABELS[c.category as OpportunityCategory] ?? c.category}
                    </span>
                  </span>
                  <span className="tabular label-mono text-primary">{c._count._all}</span>
                </Reveal>
              ))}
          </div>
        </div>
      </section>

      {/* Built different */}
      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:px-8">
          <Reveal>
            <p className="label-mono text-primary">Built different</p>
            <h2 className="mt-3 font-display text-3xl font-light tracking-tight">
              Funding tools stop at discovery. We own the 80% after the search.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <ul className="divide-y">
              {[
                "One profile flows into every application. Nothing typed twice.",
                "Eligibility checked against each program's real criteria, with a plain yes or no per rule.",
                "A task plan generated from the program's own requirements.",
                "A document vault. Upload a CV once, reuse it everywhere.",
                "Reminders timed to the real deadline, not guesswork.",
              ].map((item, i) => (
                <li key={item} className="flex items-start gap-4 py-3">
                  <span className="tabular mt-1 w-6 shrink-0 font-mono text-xs text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-primary/40">
                    <Waves className="h-3 w-3 text-primary" />
                  </span>
                  <p className="text-[15px] leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-4 py-5 text-sm text-muted-foreground md:px-8">
          {[
            { icon: Landmark, text: "Verified official sources" },
            { icon: FileText, text: "Every detail traceable" },
            { icon: Bell, text: "Deadline reminders" },
            { icon: RefreshCw, text: "The feed updates itself" },
          ].map((f) => (
            <span key={f.text} className="inline-flex items-center gap-2">
              <f.icon className="h-4 w-4 text-primary" />
              {f.text}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="tide-band paper-grain border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-8">
          <KoruMark className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-light leading-tight tracking-tight md:text-4xl">
            Your next opportunity is already listed. Someone else will take it.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Sign in with an email, complete your profile, and get matched in minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <Button size="lg" asChild>
              <Link href="/login">
                Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-7 text-sm text-muted-foreground md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <KoruMark className="h-6 w-6 text-primary" />
            <span>Koru · The Funding OS for Fiji</span>
          </div>
          <p className="label-mono">Made in Suva · 2026</p>
        </div>
      </footer>
    </div>
  );
}
