import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, FileText, Waves, Bell, Landmark, RefreshCw } from "lucide-react";
import { optionalUser } from "@/lib/auth";
import { getLandingStats } from "@/server/queries";
import { KoruMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CATEGORY_LABELS } from "@/lib/types";
import type { OpportunityCategory } from "@/lib/types";

const MATCHES = [
  { name: "Fiji Startup Challenge 2026", tag: "Startup funding", deadline: "9 days left", amount: "FJ$ 15,000" },
  { name: "Australia Awards Fiji", tag: "Scholarship", deadline: "Rolling", amount: "Full" },
  { name: "USP Research Grant", tag: "Research", deadline: "24 days left", amount: "FJ$ 8,000" },
  { name: "GEF SGP Climate Grants", tag: "Climate grant", deadline: "3 days left", amount: "US$ 5,000" },
] as const;

const TICKER = [
  "Startup funding",
  "Scholarships",
  "Climate grants",
  "Fellowships",
  "Research grants",
  "Competitions",
  "Community funds",
  "Professional development",
  "Business support",
] as const;

export default async function LandingPage() {
  const user = await optionalUser();
  if (user) redirect("/dashboard");

  const stats = await getLandingStats();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <KoruMark className="h-8 w-8 text-primary" />
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
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-16 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:pt-24">
          <div className="fade-up">
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

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t pt-6">
              <div>
                <dt className="sr-only">Live opportunities indexed</dt>
                <dd className="font-display text-4xl font-light tabular tracking-tight">{stats.total}</dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  live opportunities
                </dd>
              </div>
              <div>
                <dt className="sr-only">Categories</dt>
                <dd className="font-display text-4xl font-light tabular tracking-tight">
                  {stats.byCategory.length}
                </dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  funding types
                </dd>
              </div>
              <div>
                <dt className="sr-only">Profiles</dt>
                <dd className="font-display text-4xl font-light tabular tracking-tight">1</dd>
                <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  profile, every application
                </dd>
              </div>
            </dl>
          </div>

          {/* Hero panel — the ledger */}
          <div className="fade-up self-center [animation-delay:120ms]">
            <div className="border bg-card paper-grain">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <p className="label-mono text-muted-foreground">A preview of your matches</p>
                <span className="tabular text-sm font-medium text-primary">87% fit</span>
              </div>
              <ul className="ledger-rule">
                {MATCHES.map((o, i) => (
                  <li
                    key={o.name}
                    className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0 transition-colors hover:bg-muted/60"
                  >
                    <span className="tabular w-6 shrink-0 font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center border text-primary">
                      <Compass className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[15px] font-medium">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.tag}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-primary">{o.amount}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{o.deadline}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="label-mono text-muted-foreground">Sample data</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 text-primary" /> feed refreshes on its own
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="overflow-hidden border-t">
          <div className="marquee-track gap-10 py-3.5">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                <span className="label-mono text-muted-foreground">{t}</span>
                <span className="h-1.5 w-1.5 bg-accent/70" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
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
              <li
                key={f.step}
                className="fade-up group bg-card p-7 transition-colors hover:bg-muted/60 [animation-delay:var(--delay)]"
                style={{ "--delay": `${i * 90}ms` } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-5xl font-light text-primary/25 transition-colors group-hover:text-primary/60">
                    {f.step}
                  </span>
                  <span className="h-px w-10 bg-accent/60" />
                </div>
                <h3 className="mt-6 font-display text-xl font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Browse the catalogue */}
      <section className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-mono text-primary">Browse the catalogue</p>
              <h2 className="mt-3 font-display text-3xl font-light tracking-tight md:text-4xl">
                {stats.total} live opportunities, ranked by fit
              </h2>
            </div>
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
              .map((c) => (
                <div key={c.category} className="group flex items-center justify-between bg-background p-5 transition-colors hover:bg-muted/60">
                  <span className="font-display text-[15px] font-medium leading-tight">
                    {CATEGORY_LABELS[c.category as OpportunityCategory] ?? c.category}
                  </span>
                  <span className="tabular label-mono text-primary">{c._count._all}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Built different */}
      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:px-8">
          <div>
            <p className="label-mono text-primary">Built different</p>
            <h2 className="mt-3 font-display text-3xl font-light tracking-tight">
              Funding tools stop at discovery. We own the 80% after the search.
            </h2>
          </div>
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
      <section className="tide-paper paper-grain border-t">
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
