# Koru, the funding OS for Fiji

**Positioning:** Grants and scholarships, finished not just found.

## The problem

Fiji funds its own development through a scattered set of channels: more than a dozen ministries, the United Nations agencies present in Suva, and regional bodies like the Pacific Community and the Pacific Islands Forum. Add the bilateral donors (Australia Awards, Manaaki New Zealand Scholarships, the Commonwealth Scholarship Commission, JICA) and you have a funding map that nobody has drawn. Deadlines surface on ministry Facebook pages, in shared PDFs, on noticeboards. Fiji Time means announcements drift; an application window that closed last Friday is still being promoted on Monday.

The documents are the second wall. A single scholarship application demands transcripts, references, medical forms, statements of purpose with word counts, budget tables. A reader must reconcile requirements spread across three PDFs that contradict each other. For someone on the outer islands with a low-data connection, that is effectively a locked door.

No single index exists. There is no place where a Fijian can see every live opportunity, sort it by fit, and be told exactly what to produce and by when.

## The product

Koru walks a user through five movements.

**Find.** A curated catalogue plus an auto-syncing intake layer keeps the list current. Ingestion runs on a cadence (weekly for some sources, monthly for others) each time a user visits the app, and deduplicates by normalized title and provider so the same grant never appears twice under two names.

**Match.** The eligibility engine encodes real rules: age, citizenship, education, sector, organization type, business stage, years of experience, funding interests, which documents the user holds. For each opportunity it returns a per-rule yes or no and an overall fit score. The Pacific specifics are encoded as explicit rules rather than bolted on: the Manaaki New Zealand Scholarship entry, for example, requires Fijian citizenship, an age of 18 to 40 and a Diploma or higher, and the engine shows each of those as its own yes or no.

**Plan.** Matching your three strongest opportunities auto-opens applications during onboarding, and each application gets a generated task plan that orders the work: which document first, which deadline gates which step. Reminders fire at 14, 7, 3, and 1 days out.

**Document.** A document vault holds transcripts, references, and ID papers, and marks which required documents each application still needs. The vault is the same source the eligibility engine checks, so a missing reference letter moves the fit score, not just a checklist.

**Submit.** The walkthrough tracks each application through its stages to submission, using the dates and contacts the source program actually publishes.

## Why it's different

The competitive field looks at grants from the funder's side, or not at all. Instrumentl and GrantWatch are US-based grant databases. FundsforNGOs sells a worldwide paid feed pitched at NGOs in the global south. Devex is a jobs-and-news marketplace. Youthop and Scholars4Dev are blog-style scholarship feeds, unsearchable in practice. None of them own the Pacific.

The gaps, named:

- No Pacific aggregator exists at all. The nearest products treat Fiji as a line in a CSV.
- Nothing spans grants, scholarships, fellowships, competitions, jobs, and business support as one tracked pipeline. Products specialize; a user's life doesn't.
- No competitor encodes country-specific eligibility rules. Turn2us does this for UK benefits, which proves the pattern works, but nobody has done it for a Pacific island country.
- No application walkthrough. Ready Set College holds US students by the hand through college applications; the equivalent for an Australia Awards submission does not exist.
- No low-data, mobile-first design. Outer-island users on intermittent connections need pages that weigh little and forms that survive a dropped connection.

Two small facts keep the design honest. The Pacific Resilience Facility exists so Pacific countries can draw climate finance directly, without going through a development bank in Sydney or Manila. And a rule like the Manaaki one (citizenship, an age band and a minimum education level, each checked separately) shows that eligibility here is specific, not a checkbox a generic engine would get right by accident.

## The catalogue

Fifty-two opportunities are hand-curated across 11 categories: startup funding, climate grants, research grants, travel grants, scholarships, fellowships, competitions, business support, community grants, jobs, professional development. The funders behind them number more than two dozen, and the names carry weight in Suva: FCOSS, UNDP Pacific, USP, SPC, the Fiji Development Bank, Manaaki New Zealand, JICA, the Commonwealth Scholarship Commission, Australia Awards, the GEF Small Grants Programme, the Pacific Islands Forum Secretariat, Fiji Women's Fund, FNU, Tourism Fiji, the Ministry of Youth and Sports, Fiji Civil Service, the Rotary Peace Center at USP, The Asia Foundation, SPREP, Fiji Women in Business, Pacific Trade Invest, the Acacia Foundation, the Bakani Family Foundation, the Fiji Arts Council, the ILO, and the China Scholarship Council.

On top of that base sits a deterministic procedural generator that expands the catalogue to any size. A `--count` flag controls it, defaulting to 1800 listings with realistic titles, deadlines, amounts, required documents, and application stages. The purpose is stated plainly: a live country like Fiji does not produce 1800 simultaneous listings, so the generator exists to exercise the product at scale and to demo it convincingly.

Trust gets handled by verification levels. Each listing is marked official, partner, or community. Verified sources point at the original funder page; community submissions carry the label. The product never prints a statistic it did not compute, which matters in a market where fake grant portals do real harm.

## How it works, technically

Next.js App Router with server actions on the front, Prisma 7 over better-sqlite3 on the back (JSON stored as TEXT for portability), Tailwind v4 utilities and shadcn/ui components for the interface. Eighty-eight Vitest unit tests cover eligibility, matching, plan generation, deadline scheduling, and JSON handling. The build produces 13 routes and passes clean. Email goes through Resend when an API key exists and drops to the console log otherwise. Documents go to Supabase when configured and to local disk otherwise. Task generation uses OpenAI when configured and a rule-based planner when not. Every integration degrades to a local mode, which is how the product stays runnable on a laptop with no keys at all.

## The design system

"Lagoon ink on tide-washed paper" is the direction. A warm bone paper background, reef-navy ink, lagoon teal for the primary actions, coral reserved for tiny details. Fraunces, a display serif, carries the headlines; mono uppercase labels sit above sections. Hairline rules and sharp corners replace the pill-shaped buttons and rounded cards that every SaaS defaults to. Numbered editorial cells (01, 02, 03) give the interface the feel of a printed annual report, and a marquee ticker plus ledger-style preview panels borrow from print rather than from template marketplaces. A paper-grain noise texture keeps flat surfaces from feeling digital. The house rules are strict: no em dashes, no fabricated statistics anywhere in the product UI. The landing hero states the whole position in seven words: grants and scholarships, finished not just found.

## Built today, planned next

Working today: the full find-to-submit loop, passwordless email login (an email upserts a user and sets a 30-day HttpOnly session cookie, with a demo account at `demo@koru.fj`), the three-step onboarding wizard, auto-opening of top matches, reminders at 14/7/3/1 days, the document vault, and 88 passing tests.

Ideas, labelled as such:

- A season calendar for recurring intakes, so the Australia Awards, Manaaki, Commonwealth, and GEF SGP windows render as known repeated dates instead of surprises.
- SMS and WhatsApp alerts, because a reminder that reaches a phone on Ra is worth more than one waiting in a laptop's notification tray.
- Adviser accounts, so scholarship officers at USP or ministry staff can manage several applicants at once.
- Scam-watch, a way to flag suspect application fees before anyone pays them.
- Expansion to the other 14 Pacific island countries, each with its own eligibility rules to encode.
- Post-award tracking, so a funded project's reporting deadlines don't get forgotten the way the application deadline used to.

## Honest limitations

Several things are true and should stay visible. The demo account and some listings point at placeholder URLs rather than live funder pages. The procedurally generated catalogue is sample data, not verified listings; only the 52 curated opportunities carry real program names. The data layer is a single SQLite file, fine for a pilot, wrong for a production multi-island launch without a move to Postgres. Email, document storage, and AI generation all fall back to local modes, which means a default deployment is quiet: no email actually sent, no documents actually uploaded. Koru is an operating prototype with a working core, not a finished service with a marketing story.
