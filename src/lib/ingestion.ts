import { prisma } from "@/lib/db";
import { jstring } from "@/lib/json";
import { getAIProvider } from "@/lib/ai";

/**
 * Opportunity ingestion pipeline.
 *
 * Sources are configured in the database (never hardcoded). Each source has
 * an adapter:
 *  - "sample": deterministic offline demo datasets per source type.
 *  - "url":    fetches the source URL; if OPENAI is configured it extracts
 *              structured opportunities from the page text. Otherwise it tries
 *              structured feeds (RSS/JSON) and falls back to link extraction.
 *
 * Ingested items are published automatically and keep sourceUrl for traceability.
 * `maybeAutoSync()` runs due sources based on their cadence on each app visit,
 * so the platform pulls new opportunities on its own.
 */

export type SourceType =
  | "government"
  | "ngo"
  | "university"
  | "international"
  | "regional"
  | "private";

interface RawOpportunity {
  title: string;
  category: string;
  description: string;
  officialUrl?: string;
  fundingAmount?: string;
  deadlineDays?: number;
  isRolling?: boolean;
  estimatedHours?: number;
  difficulty?: string;
  requiredDocuments?: string[];
  stages?: { name: string; description: string; order: number }[];
  faq?: { question: string; answer: string }[];
  rules?: { field: string; operator: string; value: unknown; label?: string }[];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "opportunity"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let n = 2;
  for (;;) {
    const existing = await prisma.opportunity.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

/**
 * Normalizes a title for duplicate detection. Funding boards re-post the same
 * opportunity under slightly different wording, so we fold case, whitespace,
 * punctuation and filler words before comparing.
 */
function normalizeForDedup(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(the|a|an|for|of|in|and|2024|2025|2026|program|programme|grant|scholarship)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when an opportunity with the same normalized title already exists. */
async function isDuplicate(title: string, providerId: string): Promise<boolean> {
  const norm = normalizeForDedup(title);
  if (!norm) return false;
  const existing = await prisma.opportunity.findMany({
    where: { providerId, status: { not: "archived" } },
    select: { title: true },
    take: 500,
  });
  return existing.some((o) => normalizeForDedup(o.title) === norm);
}

const SAMPLE_PAYLOADS: Record<SourceType, RawOpportunity[]> = {
  government: [
    {
      title: "Fiji National Research Council Grant",
      category: "research-grant",
      description:
        "Funding for applied research addressing national priorities in agriculture, health and climate resilience, open to researchers and institutions in Fiji.",
      officialUrl: "https://www.research.gov.fj",
      fundingAmount: "FJD 25,000",
      deadlineDays: 58,
      estimatedHours: 14,
      difficulty: "hard",
      requiredDocuments: ["Proposal", "CV", "Academic transcript"],
      rules: [
        { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
        { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
        { field: "sector", operator: "has", value: ["Research", "Agriculture", "Climate & Environment"], label: "Research-related sector" },
      ],
    },
    {
      title: "Youth Skills Training Bursary",
      category: "professional-development",
      description:
        "Bursaries supporting unemployed young Fijians to complete accredited vocational training courses at approved institutions.",
      officialUrl: "https://www.youth.gov.fj/bursary",
      fundingAmount: "FJD 3,000",
      deadlineDays: 21,
      estimatedHours: 3,
      difficulty: "easy",
      requiredDocuments: ["National ID", "CV"],
      rules: [
        { field: "age", operator: "gte", value: 16, label: "16 years or older" },
        { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      ],
    },
  ],
  ngo: [
    {
      title: "Waste Warriors Community Fund",
      category: "community-grant",
      description:
        "Micro-grants for community groups running waste-management and recycling projects in urban and peri-urban Fiji.",
      officialUrl: "https://www.wastewarriors.org.fj",
      fundingAmount: "FJD 8,000",
      deadlineDays: 33,
      estimatedHours: 6,
      difficulty: "easy",
      requiredDocuments: ["Proposal", "Budget template"],
      rules: [
        { field: "organizationType", operator: "in", value: ["NGO", "Community group"], label: "NGO or community group" },
        { field: "sector", operator: "has", value: ["Waste Management", "Climate & Environment"], label: "Waste or climate sector" },
      ],
    },
  ],
  university: [
    {
      title: "USP Pacific Scholars Travel Award",
      category: "travel-grant",
      description:
        "Support for USP students presenting at international conferences and research symposia, covering travel and accommodation.",
      officialUrl: "https://www.usp.ac.fj/travel-award",
      fundingAmount: "FJD 5,000",
      deadlineDays: 27,
      estimatedHours: 4,
      difficulty: "easy",
      requiredDocuments: ["CV", "Academic transcript", "Proposal"],
      rules: [
        { field: "education", operator: "gte", value: "Diploma", label: "Diploma or higher" },
        { field: "fundingInterests", operator: "has", value: ["travel", "conference"], label: "Conference or travel interest" },
      ],
    },
  ],
  international: [
    {
      title: "Green Climate Fund Fiji Readiness Grant",
      category: "climate-grant",
      description:
        "Readiness support for government and civil society partners to strengthen climate finance pipelines and adaptation planning in Fiji.",
      officialUrl: "https://www.greenclimate.fund/countries/fiji",
      fundingAmount: "USD 50,000",
      deadlineDays: 95,
      estimatedHours: 20,
      difficulty: "hard",
      requiredDocuments: ["Proposal", "Budget template", "Tax certificate (TIN)"],
      rules: [
        { field: "sector", operator: "has", value: ["Climate & Environment"], label: "Climate sector" },
        { field: "organizationType", operator: "in", value: ["NGO", "Community group", "Government"], label: "Eligible organisation types" },
      ],
    },
  ],
  regional: [
    {
      title: "Pacific Digital Economy Accelerator",
      category: "startup-funding",
      description:
        "A regional accelerator for Pacific tech startups, providing seed funding, mentorship and access to regional markets.",
      officialUrl: "https://www.pacificdigital.gg",
      fundingAmount: "FJD 40,000",
      deadlineDays: 52,
      estimatedHours: 12,
      difficulty: "medium",
      requiredDocuments: ["Business registration", "Proposal", "CV"],
      rules: [
        { field: "organizationType", operator: "in", value: ["Startup", "SME"], label: "Startup or SME" },
        { field: "sector", operator: "has", value: ["ICT / Technology"], label: "Technology sector" },
      ],
    },
  ],
  private: [
    {
      title: "Bakani Family Foundation Youth Scholarship",
      category: "scholarship",
      description:
        "Merit-based scholarships for outstanding Fijian secondary students entering tertiary study in STEM and business.",
      officialUrl: "https://www.bakanifoundation.fj",
      fundingAmount: "FJD 12,000 / year",
      deadlineDays: 44,
      estimatedHours: 8,
      difficulty: "medium",
      requiredDocuments: ["Academic transcript", "Recommendation letter", "CV"],
      rules: [
        { field: "age", operator: "lte", value: 24, label: "24 years or younger" },
        { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
        { field: "education", operator: "in", value: ["Secondary", "Certificate", "Diploma", "Bachelor's"], label: "Secondary or tertiary" },
      ],
    },
  ],
};

export async function runIngestion(sourceId: string): Promise<{ status: string; itemsFound: number; itemsAdded: number; itemsSkipped: number; error?: string }> {
  const source = await prisma.ingestionSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Ingestion source not found.");
  if (!source.enabled) throw new Error("Source is disabled.");

  await prisma.ingestionSource.update({
    where: { id: sourceId },
    data: { syncStatus: "running", lastError: null },
  });

  const startedAt = new Date();
  let itemsFound = 0;
  let itemsAdded = 0;
  let itemsSkipped = 0;
  let status: "success" | "partial" | "failed" = "success";
  let error: string | undefined;

  try {
    const raw = source.adapter === "url" ? await fetchFromUrl(source) : SAMPLE_PAYLOADS[source.sourceType as SourceType] ?? [];
    itemsFound = raw.length;

    for (const item of raw) {
      const providerId = await providerFor(source);
      if (!providerId) continue;

      // Skip re-posts of an opportunity this provider already lists (redundancy).
      if (await isDuplicate(item.title, providerId)) {
        itemsSkipped++;
        continue;
      }

      const slug = await uniqueSlug(item.title);

      await prisma.opportunity.create({
        data: {
          slug,
          title: item.title,
          providerId,
          category: item.category,
          deadline: item.deadlineDays ? daysFromNow(item.deadlineDays) : null,
          isRolling: item.isRolling ?? false,
          description: item.description,
          officialUrl: item.officialUrl ?? source.url,
          sourceUrl: source.url,
          fundingAmount: item.fundingAmount,
          estimatedHours: item.estimatedHours ?? 4,
          difficulty: item.difficulty ?? "medium",
          status: "published",
          verificationLevel: "community",
          requiredDocuments: jstring(item.requiredDocuments ?? []),
          stages: jstring(item.stages ?? []),
          faq: jstring(item.faq ?? []),
          lastVerifiedAt: new Date(),
        },
      });

      const opp = await prisma.opportunity.findUniqueOrThrow({ where: { slug } });
      for (const rule of item.rules ?? []) {
        await prisma.eligibilityRule.create({
          data: {
            opportunityId: opp.id,
            field: rule.field,
            operator: rule.operator,
            value: jstring(rule.value),
            required: true,
            label: rule.label,
          },
        });
      }
      itemsAdded++;
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message.slice(0, 500) : "Sync failed.";
  }

  if (status !== "failed" && itemsFound > 0 && itemsAdded === 0) status = "partial";

  await prisma.$transaction([
    prisma.ingestionSource.update({
      where: { id: sourceId },
      data: { syncStatus: status, lastSyncAt: new Date(), lastError: error },
    }),
    prisma.syncLog.create({
      data: { sourceId, status, itemsFound, itemsAdded, error, startedAt, finishedAt: new Date() },
    }),
  ]);

  return { status, itemsFound, itemsAdded, itemsSkipped, error };
}

async function providerFor(source: { id: string; name: string; url: string }) {
  // Reuse a provider already tied to this source; otherwise create one.
  const existing = await prisma.provider.findFirst({
    where: { ingestionSourceId: source.id },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing.id;
  const created = await prisma.provider.create({
    data: {
      organization: source.name,
      website: source.url,
      country: "Fiji",
      verified: false,
      ingestionSourceId: source.id,
    },
  });
  return created.id;
}

async function fetchFromUrl(source: { url: string }): Promise<RawOpportunity[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let text = "";
  try {
    const res = await fetch(source.url, { signal: controller.signal, headers: { "User-Agent": "Koru-Ingestion/1.0" } });
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    text = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  const provider = getAIProvider();
  if (provider.name !== "local") {
    const parsed = await extractWithAI(source.url, text);
    if (parsed.length > 0) return parsed;
  }

  const fromFeed = parseStructuredFeed(text);
  if (fromFeed.length > 0) return fromFeed;

  const fromLinks = parseLinks(source.url, text);
  if (fromLinks.length > 0) return fromLinks;

  throw new Error(
    "No opportunities could be extracted from this page. Add an OPENAI_API_KEY for AI extraction, or provide an RSS/JSON feed URL.",
  );
}

async function extractWithAI(url: string, text: string): Promise<RawOpportunity[]> {
  const ai = getAIProvider();
  const prompt = [
    `Extract a JSON array of funding/development opportunities from the following page text.`,
    `For each opportunity return: title, category (startup-funding|climate-grant|research-grant|travel-grant|scholarship|fellowship|competition|business-support|community-grant|job|professional-development), description (max 2 sentences, from the page only), officialUrl, fundingAmount if stated, deadlineDays if a date is given (relative to today), estimatedHours, difficulty.`,
    `Do not invent any data that is not on the page. If nothing qualifies, return [].`,
    `Page source: ${url}`,
    ``,
    text.slice(0, 12_000),
  ].join("\n");

  const raw = await ai.complete("You extract structured data. Return only valid JSON.", prompt, { temperature: 0 });
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as RawOpportunity[];
    return parsed.filter((o) => o.title && o.category && o.description);
  } catch {
    return [];
  }
}

function parseStructuredFeed(text: string): RawOpportunity[] {
  try {
    const json = JSON.parse(text) as { items?: { title: string; link?: string; description?: string }[] };
    if (Array.isArray(json.items)) {
      return json.items.slice(0, 20).map((i) => ({
        title: i.title,
        description: i.description ?? "See official page for details.",
        officialUrl: i.link,
        category: "other",
        difficulty: "medium",
      }));
    }
  } catch {
    // not JSON — try RSS
  }
  const rssItems = [...text.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<description>(.*?)<\/description>[\s\S]*?<\/item>/g)]
    .slice(0, 20)
    .map((m) => ({
      title: m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
      description: m[3].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").slice(0, 300),
      officialUrl: m[2].trim(),
      category: "other",
      difficulty: "medium",
    }));
  return rssItems;
}

function parseLinks(baseUrl: string, text: string): RawOpportunity[] {
  const hrefs = [...text.matchAll(/href=["']([^"']+)["']/g)]
    .map((m) => {
      try {
        return new URL(m[1], baseUrl).href;
      } catch {
        return null;
      }
    })
    .filter((u): u is string => Boolean(u))
    .filter((u) => u.startsWith("http"))
    .slice(0, 30);
  const seen = new Set<string>();
  const unique = hrefs.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
  return unique.map((u) => ({
    title: `Opportunity from ${new URL(u).hostname}`,
    description: "Listed on the source site — open the link to review details before publishing.",
    officialUrl: u,
    category: "other",
    difficulty: "medium",
  }));
}

const CADENCE_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Runs every enabled source whose cadence interval has elapsed since its last
 * sync. Idempotent by construction: only sources past their interval run, and
 * each run records a SyncLog. Call once per app visit (cheap when nothing is due).
 */
export async function maybeAutoSync(): Promise<{ ran: number; skipped: number }> {
  const sources = await prisma.ingestionSource.findMany({ where: { enabled: true } });
  let ran = 0;
  let skipped = 0;

  for (const source of sources) {
    const interval = CADENCE_MS[source.cadence] ?? CADENCE_MS.weekly;
    const due = !source.lastSyncAt || Date.now() - source.lastSyncAt.getTime() >= interval;
    if (source.syncStatus === "running") {
      skipped++;
      continue;
    }
    if (!due) {
      skipped++;
      continue;
    }
    try {
      await runIngestion(source.id);
      ran++;
    } catch {
      skipped++;
    }
  }
  return { ran, skipped };
}
