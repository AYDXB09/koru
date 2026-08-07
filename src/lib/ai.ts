import OpenAI from "openai";

/**
 * AI assistive layer.
 *
 * Koru's AI never invents facts. Every prompt is constructed from official
 * source data (opportunity fields, eligibility rules, FAQs, user documents).
 * A deterministic local provider is used when no OPENAI_API_KEY is configured,
 * so the product remains fully functional offline and in tests.
 */

export type KoruTask =
  | "eligibility"
  | "checklist"
  | "outline"
  | "answer"
  | "summarize"
  | "rewrite"
  | "digest";

export interface AIProvider {
  readonly name: string;
  readonly available: boolean;
  complete(system: string, user: string, opts?: { temperature?: number }): Promise<string>;
}

// ---------------------------------------------------------------------------
// OpenAI provider
// ---------------------------------------------------------------------------

const GROUNDING_RULE = [
  "You are Koru, the funding copilot for Fiji.",
  "CRITICAL: Never invent facts. Only use the data provided in the prompt.",
  "If the requested information is not present in the provided data, say so plainly and suggest what the user should check.",
  "Keep answers concise, practical, and in clear English.",
].join("\n");

class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  get available() {
    return this.client !== null;
  }

  async complete(system: string, user: string, opts?: { temperature?: number }) {
    if (!this.client) throw new Error("OpenAI is not configured.");
    const res = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: `${GROUNDING_RULE}\n\n${system}` },
        { role: "user", content: user },
      ],
      temperature: opts?.temperature ?? 0.4,
    });
    return res.choices[0]?.message?.content ?? "";
  }
}

// ---------------------------------------------------------------------------
// Deterministic local provider (offline / tests / demo)
// ---------------------------------------------------------------------------

function extractJsonBlocks(text: string): string[] {
  const blocks: string[] = [];
  const re = /__KORU_DATA__=([\s\S]*?)__END__/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    blocks.push(m[1]);
  }
  return blocks;
}

function firstJson(text: string, fallback: unknown): unknown {
  const blocks = extractJsonBlocks(text);
  if (blocks.length === 0) return fallback;
  try {
    return JSON.parse(blocks[0]);
  } catch {
    return fallback;
  }
}

function wrap(task: KoruTask, user: string): string {
  return `__KORU_TASK__=${task}\n${user}`;
}

class LocalProvider implements AIProvider {
  readonly name = "local";
  readonly available = true;

  async complete(system: string, user: string) {
    const taskMatch = /__KORU_TASK__=(\w+)/.exec(user);
    const task = (taskMatch?.[1] ?? "summarize") as KoruTask;
    const data = firstJson(user, null) as Record<string, unknown> | null;

    switch (task) {
      case "eligibility":
        return this.eligibility(data);
      case "checklist":
        return this.checklist(data);
      case "outline":
        return this.outline(data);
      case "answer":
        return this.answer(data, user);
      case "summarize":
        return this.summarize(data);
      case "digest":
        return this.digest(data);
      case "rewrite":
        return this.rewrite(data);
      default:
        return "I can only answer from the official documents provided.";
    }
  }

  private eligibility(data: Record<string, unknown> | null): string {
    if (!data) return "No eligibility data was provided.";
    const result = data as unknown as {
      requiredSatisfied: number;
      requiredTotal: number;
      eligible: boolean;
      results: { field: string; detail: string; satisfied: boolean }[];
    };
    const lines = [
      `Based on your profile and the official eligibility criteria, you satisfy **${result.requiredSatisfied} of ${result.requiredTotal}** required conditions.`,
      result.eligible
        ? "You appear to meet all required eligibility criteria."
        : "Some required criteria are still missing.",
      "",
      "What this is based on:",
    ];
    for (const r of result.results ?? []) {
      lines.push(`- ${r.satisfied ? "✓" : "✗"} ${r.detail}`);
    }
    lines.push(
      "",
      "Reminder: always confirm final eligibility on the official application page — the source of truth is the provider.",
    );
    return lines.join("\n");
  }

  private checklist(data: Record<string, unknown> | null): string {
    if (!data) return "No checklist data was provided.";
    const title = String(data.title ?? "this application");
    const docs = Array.isArray(data.requiredDocuments) ? (data.requiredDocuments as string[]) : [];
    const stages = Array.isArray(data.stages)
      ? (data.stages as { name: string; description?: string }[])
      : [];
    const lines: string[] = [`Here is a step-by-step checklist for **${title}**:`, ""];
    let n = 1;
    if (stages.length > 0) {
      lines.push(`_Application stages (${stages.length}):_`);
      for (const s of [...stages].sort((a, b) => (a.name > b.name ? 1 : -1))) {
        lines.push(`${n++}. Complete the stage: ${s.name}${s.description ? ` — ${s.description}` : ""}`);
      }
      lines.push("");
    }
    if (docs.length > 0) {
      lines.push(`_Documents to prepare (${docs.length}):_`);
      for (const d of docs) lines.push(`${n++}. Prepare and upload: ${d}`);
      lines.push("");
    }
    lines.push(`${n++}. Review the full requirements on the official page.`);
    lines.push(`${n++}. Submit before the deadline.`);
    return lines.join("\n");
  }

  private outline(data: Record<string, unknown> | null): string {
    if (!data) return "No proposal details were provided.";
    const title = String(data.title ?? "Your proposal");
    const description = String(data.description ?? "");
    return [
      `Outline for: **${title}**`,
      "",
      "1. Problem statement",
      `   - Describe the problem this project addresses${description ? ` (based on your description: "${description.slice(0, 160)}${description.length > 160 ? "…" : ""}")` : ""}.`,
      "2. Goal and objectives",
      "   - State the primary goal and 2-3 measurable objectives.",
      "3. Approach / activities",
      "   - List the concrete activities and the timeline.",
      "4. Budget",
      "   - Itemise expected costs in FJD with a short justification.",
      "5. Impact & beneficiaries",
      "   - Who benefits, and what changes as a result.",
      "6. Sustainability",
      "   - How the work continues beyond the funding period.",
      "",
      "Use this structure to draft your proposal, then rewrite it in your own words.",
    ].join("\n");
  }

  private answer(data: Record<string, unknown> | null, user: string): string {
    const question = user.replace(/__KORU_TASK__=\w+\n/, "").split("__KORU_DATA__=")[0].trim();
    const faq = Array.isArray(data?.faq) ? (data.faq as { question: string; answer: string }[]) : [];
    const qn = question.toLowerCase();
    const hit = faq.find((f) => f.question.toLowerCase().includes(qn) || qn.includes(f.question.toLowerCase().slice(0, 20)));
    if (hit) return hit.answer;
    const docs = Array.isArray(data?.requiredDocuments) ? (data.requiredDocuments as string[]) : [];
    if (faq.length > 0) {
      return [
        "I couldn't find an exact match in the official FAQ.",
        "These are the official questions I can answer:",
        ...faq.map((f) => `- ${f.question}`),
        "",
        "For anything else, please check the official application page linked on this opportunity.",
      ].join("\n");
    }
    if (docs.length > 0) {
      return "I can only answer from the official information on this page. No FAQ is available for this opportunity — please check the official application page or contact the provider directly.";
    }
    return "I can only answer from the official information provided. Please ask about this opportunity's requirements, deadlines, or documents.";
  }

  private summarize(data: Record<string, unknown> | null): string {
    if (!data) return "No opportunity data was provided.";
    return [
      `**${String(data.title ?? "Opportunity")}**`,
      "",
      String(data.description ?? "No description available."),
      "",
      this.facts(data),
    ].join("\n");
  }

  private facts(data: Record<string, unknown>): string {
    const lines: string[] = [];
    const add = (label: string, value: unknown) => {
      if (value !== null && value !== undefined && value !== "") lines.push(`- ${label}: ${value}`);
    };
    add("Provider", data.provider);
    add("Category", data.category);
    add("Funding", data.fundingAmount ? `${data.fundingAmount} ${String(data.currency ?? "FJD")}` : null);
    add("Deadline", data.deadline);
    add("Estimated effort", data.estimatedHours ? `${data.estimatedHours} hours` : null);
    add("Difficulty", data.difficulty);
    add("Official page", data.officialUrl);
    return lines.join("\n");
  }

  private digest(data: Record<string, unknown> | null): string {
    const items = Array.isArray(data?.items) ? (data.items as { title: string; detail: string }[]) : [];
    if (items.length === 0) return "No upcoming deadlines this week.";
    return [
      "Your weekly deadline digest:",
      "",
      ...items.map((i) => `- **${i.title}**: ${i.detail}`),
    ].join("\n");
  }

  private rewrite(data: Record<string, unknown> | null): string {
    const text = String(data?.text ?? "");
    if (!text.trim()) return "No text was provided to rewrite.";
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return paragraphs.join("\n\n");
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;
  const openai = new OpenAIProvider();
  cachedProvider = openai.available ? openai : new LocalProvider();
  return cachedProvider;
}

// ---------------------------------------------------------------------------
// High-level task helpers (used by server actions)
// ---------------------------------------------------------------------------

async function run(system: string, user: string): Promise<string> {
  const provider = getAIProvider();
  return provider.complete(system, user, { temperature: 0.4 });
}

export async function explainEligibility(payload: unknown): Promise<string> {
  return run(
    "Explain the eligibility assessment using only the data provided.",
    wrap("eligibility", `__KORU_DATA__=${JSON.stringify(payload)}__END__`),
  );
}

export async function generateChecklist(payload: {
  title: string;
  requiredDocuments: string[];
  stages: { name: string; description?: string }[];
}): Promise<string> {
  return run(
    "Generate a practical checklist from the data provided. Never add requirements that are not listed.",
    wrap("checklist", `__KORU_DATA__=${JSON.stringify(payload)}__END__`),
  );
}

export async function suggestOutline(payload: {
  title: string;
  description: string;
}): Promise<string> {
  return run(
    "Suggest a proposal outline. Use only the title and description provided.",
    wrap("outline", `__KORU_DATA__=${JSON.stringify(payload)}__END__`),
  );
}

export async function answerQuestion(
  question: string,
  payload: { faq?: { question: string; answer: string }[]; requiredDocuments?: string[] },
): Promise<string> {
  return run(
    "Answer using only the official data provided.",
    wrap("answer", `${question}\n__KORU_DATA__=${JSON.stringify(payload)}__END__`),
  );
}

export async function weeklyDigest(items: { title: string; detail: string }[]): Promise<string> {
  return run(
    "Write a short weekly digest of upcoming deadlines from the data provided.",
    wrap("digest", `__KORU_DATA__=${JSON.stringify({ items })}__END__`),
  );
}

export async function rewriteText(text: string): Promise<string> {
  return run(
    "Rewrite the user's draft to be clearer and more professional. Keep all facts and figures identical.",
    wrap("rewrite", `__KORU_DATA__=${JSON.stringify({ text })}__END__`),
  );
}
