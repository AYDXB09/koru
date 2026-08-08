import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

type Rng = () => number;

const PLACES = [
  "Suva",
  "Lautoka",
  "Nadi",
  "Labasa",
  "Levuka",
  "Savusavu",
  "Ba",
  "Sigatoka",
  "Rakiraki",
  "Vanua Levu",
  "Taveuni",
  "Kadavu",
  "Rotuma",
  "Ovalau",
  "Yasawa",
  "Viti Levu",
  "Natadola",
  "Navua",
  "Tavua",
  "Korovou",
];

const SECTORS = [
  "Agriculture",
  "Fisheries",
  "Tourism",
  "Climate Resilience",
  "Digital",
  "Renewable Energy",
  "Health",
  "Education",
  "Arts",
  "Marine",
  "Water",
  "Forestry",
  "Community Development",
  "Youth",
  "Women's Economic Empowerment",
];

const STUDY_FIELDS = [
  "Agriculture",
  "Engineering",
  "Public Health",
  "Education",
  "Business",
  "Law",
  "Marine Science",
  "Climate Studies",
  "ICT",
  "Nursing",
  "Social Work",
];

const NOUNS: Record<string, string[]> = {
  "startup-funding": ["Grant", "Fund", "Accelerator", "Bootcamp", "Challenge", "Incubator", "Seed Fund", "Venture Fund", "Pitch Competition"],
  "climate-grant": ["Grant", "Fund", "Small Grant", "Project Grant", "Community Grant", "Adaptation Fund", "Resilience Grant"],
  "research-grant": ["Grant", "Fund", "Bursary", "Award", "Seed Grant", "Research Grant"],
  "travel-grant": ["Award", "Grant", "Bursary", "Support"],
  scholarship: ["Scholarship", "Bursary", "Award", "Scholarship Fund"],
  fellowship: ["Fellowship", "Programme", "Fellowship Scheme", "Residency"],
  competition: ["Challenge", "Competition", "Award", "Prize", "Hackathon", "Pitch"],
  "business-support": ["Grant", "Loan", "Mentorship Programme", "Accelerator", "Incubator", "Support Scheme", "Advisory Programme"],
  "community-grant": ["Grant", "Micro-Grant", "Community Grant", "Village Grant", "Small Grant"],
  job: ["Programme", "Scheme", "Posting"],
  "professional-development": ["Grant", "Bursary", "Fund", "Award", "Scholarship", "Stipend"],
};

const TITLE_TEMPLATES: Record<string, string[]> = {
  "startup-funding": [
    "{provider} {place} Startup {noun}",
    "{provider} {sector} Startup {noun}",
    "{place} {sector} Startup {noun}",
    "{provider} {place} {sector} {noun}",
    "{provider} {sector} Innovation {noun}",
    "{place} Startup {noun} for Early-Stage Ventures",
    "{provider} {noun} for {place} Startups",
  ],
  "climate-grant": [
    "{provider} {place} {sector} {noun}",
    "{place} Community {sector} {noun}",
    "{provider} {sector} Small {noun}",
    "{place} {sector} Adaptation {noun}",
    "{provider} {place} Community Climate {noun}",
    "{provider} {sector} Resilience {noun}",
  ],
  "research-grant": [
    "{provider} {place} {sector} Research {noun}",
    "{provider} {field} Research {noun}",
    "{place} {field} Research {noun}",
    "{provider} {place} Research {noun}",
    "{provider} {sector} Studies {noun}",
  ],
  "travel-grant": [
    "{provider} {place} Conference Travel {noun}",
    "{place} {sector} Travel {noun}",
    "{provider} {field} Conference Travel {noun}",
    "{provider} {place} Travel {noun}",
  ],
  scholarship: [
    "{provider} {field} {noun}",
    "{provider} {place} {field} {noun}",
    "{provider} {field} Undergraduate {noun}",
    "{provider} Postgraduate {field} {noun}",
    "{provider} {place} Tertiary {noun}",
    "{provider} {field} Excellence {noun}",
    "{provider} {field} Study {noun}",
  ],
  fellowship: [
    "{provider} {place} {sector} {noun}",
    "{provider} {place} Leadership {noun}",
    "{provider} Young Pacific {noun}",
    "{place} {sector} {noun}",
    "{provider} Emerging {sector} {noun}",
  ],
  competition: [
    "{provider} {place} {sector} {noun}",
    "{place} {sector} {noun}",
    "{provider} {sector} Innovation {noun}",
    "{provider} {place} Ideas {noun}",
    "{place} {sector} Challenge Cup",
  ],
  "business-support": [
    "{provider} {place} SME {noun}",
    "{provider} {sector} Business {noun}",
    "{place} Business {noun}",
    "{provider} {place} Enterprise {noun}",
    "{provider} {sector} Growth {noun}",
  ],
  "community-grant": [
    "{provider} {place} Community {noun}",
    "{place} Village {sector} {noun}",
    "{provider} {sector} Community {noun}",
    "{provider} {place} {sector} {noun}",
    "{place} Community Development {noun}",
  ],
  job: [
    "{provider} {place} {sector} Officer",
    "{provider} {sector} Graduate Officer",
    "{provider} {place} {field} Trainee",
    "{provider} {sector} Coordinator",
    "{place} {sector} Analyst",
    "{provider} {place} {sector} Assistant",
  ],
  "professional-development": [
    "{provider} {sector} Training {noun}",
    "{provider} {place} {sector} Bootcamp",
    "{place} {sector} Skills {noun}",
    "{provider} {sector} Certification {noun}",
    "{provider} {place} {sector} Workshop Series",
  ],
};

const CATEGORY_WEIGHTS: [string, number][] = [
  ["scholarship", 16],
  ["startup-funding", 16],
  ["climate-grant", 14],
  ["community-grant", 14],
  ["professional-development", 8],
  ["fellowship", 8],
  ["business-support", 7],
  ["research-grant", 7],
  ["competition", 6],
  ["travel-grant", 2],
  ["job", 2],
];

const PACIFIC_SCOPES = [
  "Samoa",
  "Tonga",
  "Vanuatu",
  "Solomon Islands",
  "Kiribati",
  "Tuvalu",
  "PNG",
  "Marshall Islands",
  "Cook Islands",
  "Niue",
  "Palau",
  "FSM",
  "Nauru",
  "Pacific region",
];

const SHORT_NAMES: Record<string, string[]> = {
  "Fiji Commerce & Employers Federation": ["FCEF", "Fiji Commerce"],
  "UNDP Pacific Office in Fiji": ["UNDP Pacific"],
  "University of the South Pacific": ["USP"],
  "Australia Awards": ["Australia Awards"],
  "Fiji Women's Fund": ["Fiji Women's Fund"],
  "Pacific Community (SPC)": ["SPC", "Pacific Community"],
  "Tourism Fiji": ["Tourism Fiji"],
  "Fiji Ministry of Youth and Sports": ["Ministry of Youth", "Fiji Youth Ministry"],
  "Fiji Civil Service": ["Fiji Civil Service"],
  "Manaaki New Zealand Scholarships": ["Manaaki New Zealand"],
  "Fiji National University": ["FNU"],
  "Global Environment Facility SGP": ["GEF SGP"],
  "Pacific Islands Forum Secretariat": ["PIFS", "Forum Secretariat"],
  "International Labour Organization": ["ILO"],
  "Fiji Development Bank": ["FDB"],
  "Commonwealth Scholarship Commission": ["Commonwealth Scholarships"],
  "Japan International Cooperation Agency (JICA)": ["JICA"],
  "Ministry of Education (China)": ["China MOE"],
  "Rotary Peace Center, USP": ["Rotary Peace Center"],
  "The Asia Foundation": ["Asia Foundation"],
  "SPREP": ["SPREP"],
  "Fiji Women in Business Association": ["FWiB"],
  "Pacific Trade Invest": ["Pacific Trade Invest"],
  "FCOSS": ["FCOSS"],
  "Acacia Foundation": ["Acacia Foundation"],
  "Bakani Family Foundation": ["Bakani Foundation"],
  "Fiji Arts Council": ["Fiji Arts Council"],
};

const DESCRIPTIONS: Record<string, string[]> = {
  "startup-funding": [
    "Seed funding for early-stage {sector} ventures in {place} and surrounding districts.",
    "Applicants pitch their idea to a panel of local business leaders.",
    "Winners receive grant funding plus six months of mentoring.",
    "Priority is given to ventures creating local jobs.",
    "The programme runs as a structured cohort with regular workshops.",
    "Applicants should have a working product or a clear pilot plan.",
  ],
  "climate-grant": [
    "Funding for community-led projects that strengthen {sector} in {place}.",
    "Projects should show clear local impact and community support.",
    "Grants cover materials, training and small-scale infrastructure.",
    "Proposals are assessed on feasibility and long-term sustainability.",
    "Community groups and village committees are strongly encouraged to apply.",
    "Successful projects report on outcomes within twelve months.",
  ],
  "research-grant": [
    "Support for applied research on {sector} priorities in the Pacific.",
    "Researchers should be affiliated with a recognised institution.",
    "Funding covers fieldwork, equipment and analysis costs.",
    "Findings are expected to be shared through a public report.",
    "Early-career researchers and postgraduate students are encouraged to apply.",
  ],
  "travel-grant": [
    "Covers travel and accommodation for presenters attending conferences.",
    "Funding helps cover registration fees and airfare.",
    "Applicants should have an accepted talk or paper.",
  ],
  scholarship: [
    "Covers tuition and living costs for study in a {field} program.",
    "Applicants must hold a strong academic record.",
    "Awardees are expected to return to the Pacific after their studies.",
    "Includes a return airfare and a monthly stipend.",
    "Open to students entering undergraduate or postgraduate study.",
    "Selection is based on academic merit and the strength of the study plan.",
  ],
  fellowship: [
    "A leadership programme pairing fellows with mentors and real projects.",
    "Fellows complete online coursework and an in-person workshop.",
    "Participants work on a project in their own community.",
    "The programme builds skills in {sector} and community leadership.",
    "Applications are open to early-career professionals across the Pacific.",
  ],
  competition: [
    "A national contest for the strongest {sector} solutions.",
    "Entries are judged on practicality, cost and reach.",
    "Finalists present live in front of a panel of judges.",
    "Winners receive prize funding and a pilot opportunity.",
    "Individuals, teams and small ventures based in {place} are eligible.",
  ],
  "business-support": [
    "Practical support for SMEs operating in {place}.",
    "Includes workshops, advisory sessions and access to finance.",
    "Designed for businesses trading for at least a year.",
    "Participants join a cohort and work on a growth plan.",
    "The programme connects owners with local mentors.",
  ],
  "community-grant": [
    "Micro-funding for community groups in {place} working on {sector}.",
    "Grants support activities run by local volunteers.",
    "Community organisations and village committees are eligible.",
    "Funding can cover materials, transport and a small labour allowance.",
    "Projects should benefit a defined community or district.",
  ],
  job: [
    "A paid placement for graduates in the {sector} field.",
    "Based in {place} with a fixed-term contract.",
    "The role includes training and mentorship from senior staff.",
    "Applicants should have relevant qualifications and a strong work ethic.",
  ],
  "professional-development": [
    "Co-funding for courses and certifications that build job-ready skills.",
    "Covers fees for short courses and online training.",
    "Applicants should connect the training to their current role.",
    "Funding is paid directly to the training provider.",
    "Open to professionals and students aged 18 and over.",
  ],
};

const STAGES: Record<string, { name: string; description: string }[]> = {
  "startup-funding": [
    { name: "Check eligibility", description: "Confirm you meet the eligibility criteria before applying." },
    { name: "Online application", description: "Company profile, pitch summary and supporting documents." },
    { name: "Shortlist review", description: "Applicants are shortlisted for an interview or pitch." },
    { name: "Interview", description: "Shortlisted applicants meet the selection panel." },
    { name: "Pitch day", description: "Finalists pitch their venture to the judging panel." },
  ],
  "climate-grant": [
    { name: "Check eligibility", description: "Confirm your group and project meet the criteria." },
    { name: "Concept note", description: "Two-page concept note describing the project." },
    { name: "Full proposal", description: "Detailed proposal and budget for shortlisted applicants." },
    { name: "Site visit", description: "A site visit confirms community support and feasibility." },
  ],
  "research-grant": [
    { name: "Check eligibility", description: "Confirm you meet the eligibility criteria before applying." },
    { name: "Research proposal", description: "Submit your research proposal and methodology." },
    { name: "Review", description: "Committee review and interview." },
  ],
  "travel-grant": [
    { name: "Check eligibility", description: "Confirm you meet the eligibility criteria." },
    { name: "Application", description: "Submit your application and supporting documents." },
    { name: "Approval", description: "Applications are approved and funds released." },
  ],
  scholarship: [
    { name: "Check eligibility", description: "Confirm you meet the eligibility criteria before applying." },
    { name: "Online application", description: "Complete the online application and upload documents." },
    { name: "Shortlisting", description: "Applications are reviewed against selection criteria." },
    { name: "Written exam", description: "Sit the written assessment." },
    { name: "Interview", description: "Shortlisted applicants attend an interview." },
  ],
  fellowship: [
    { name: "Application form", description: "Profile, motivation and leadership questions." },
    { name: "Reference check", description: "One referee is contacted." },
    { name: "Interview", description: "Shortlisted applicants attend an interview." },
  ],
  competition: [
    { name: "Submit entry", description: "Submit your entry with supporting materials." },
    { name: "Semi-finals", description: "Shortlisted entries advance to a pitch round." },
    { name: "Finals", description: "Finalists present live to the judging panel." },
  ],
  "business-support": [
    { name: "Apply", description: "Submit the application form and documents." },
    { name: "Cohort interview", description: "Meet the programme team." },
    { name: "Programme", description: "Participate in the structured programme." },
  ],
  "community-grant": [
    { name: "Letter of interest", description: "One-page letter describing your group and project." },
    { name: "Full proposal", description: "Detailed proposal and budget." },
    { name: "Review", description: "Applications are reviewed by the funding committee." },
  ],
  job: [
    { name: "Apply online", description: "Submit application and documents." },
    { name: "Assessment", description: "Complete a written task." },
    { name: "Interview", description: "Shortlisted applicants attend an interview." },
  ],
  "professional-development": [
    { name: "Apply", description: "Submit course details and a quote." },
    { name: "Shortlist", description: "Applications are reviewed for funding." },
    { name: "Enrol", description: "Successful applicants enrol in the training." },
  ],
};

const WHO_ANSWERS: Record<string, string> = {
  "startup-funding": "Fijian-owned startups and SMEs registered in Fiji.",
  "climate-grant": "Registered NGOs, community groups and civil society organisations.",
  "research-grant": "Researchers affiliated with a recognised institution.",
  "travel-grant": "Students and professionals with an accepted presentation.",
  scholarship: "Citizens of Pacific island countries meeting the academic requirements.",
  fellowship: "Early-career professionals active in their communities.",
  competition: "Individuals, teams and small ventures based in the Pacific.",
  "business-support": "Registered SMEs trading in Fiji.",
  "community-grant": "Community groups, village committees and NGOs.",
  job: "Candidates with the required qualifications and experience.",
  "professional-development": "Professionals and students seeking job-ready skills.",
};

const FAQ_POOL = [
  { question: "Is the deadline strict?", answer: "Applications received after the deadline are not considered." },
  { question: "When will I hear back?", answer: "Applicants are contacted within four weeks of the closing date." },
  { question: "How is funding paid?", answer: "In tranches against agreed milestones." },
  { question: "Do I need a registered business?", answer: "No, but winners are asked to register within a year." },
  { question: "Can I apply more than once?", answer: "Yes, if you meet the eligibility criteria each round." },
];

const DOCS: Record<string, string[]> = {
  "startup-funding": ["Business registration", "CV", "Proposal", "Budget template", "Tax certificate (TIN)", "Business plan", "Bank statement"],
  "climate-grant": ["Proposal", "Budget template", "Tax certificate (TIN)", "Bank statement", "CV", "Business registration"],
  "research-grant": ["Proposal", "CV", "Academic transcript", "Recommendation letter", "Budget template", "Passport"],
  "travel-grant": ["CV", "Academic transcript", "Recommendation letter", "Proposal", "Passport"],
  scholarship: ["Passport", "Academic transcript", "CV", "Recommendation letter", "Employment letter", "Health certificate", "National ID"],
  fellowship: ["CV", "Recommendation letter", "Passport", "Academic transcript", "Proposal"],
  competition: ["Proposal", "CV", "Business registration", "Academic transcript", "Portfolio"],
  "business-support": ["Business registration", "Tax certificate (TIN)", "Bank statement", "Business plan", "CV", "Budget template"],
  "community-grant": ["Proposal", "Budget template", "Bank statement", "National ID", "CV"],
  job: ["CV", "Academic transcript", "Recommendation letter", "National ID", "Employment letter", "Passport"],
  "professional-development": ["CV", "National ID", "Recommendation letter", "Academic transcript", "Employment letter"],
};

const AMOUNT_CFG: Record<string, { min: number; max: number; usdChance: number }> = {
  "startup-funding": { min: 3000, max: 50000, usdChance: 0.1 },
  "climate-grant": { min: 4000, max: 50000, usdChance: 0.7 },
  "research-grant": { min: 3000, max: 25000, usdChance: 0.4 },
  "travel-grant": { min: 500, max: 5000, usdChance: 0.3 },
  competition: { min: 2000, max: 30000, usdChance: 0.3 },
  "business-support": { min: 5000, max: 100000, usdChance: 0 },
  "community-grant": { min: 1000, max: 20000, usdChance: 0.1 },
  "professional-development": { min: 1000, max: 5000, usdChance: 0 },
};

const AMOUNT_STEPS = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];

const HOURS: Record<string, [number, number]> = {
  "startup-funding": [6, 30],
  "climate-grant": [8, 40],
  "research-grant": [6, 45],
  "travel-grant": [2, 8],
  scholarship: [8, 60],
  fellowship: [10, 45],
  competition: [3, 15],
  "business-support": [4, 20],
  "community-grant": [3, 12],
  job: [3, 10],
  "professional-development": [2, 20],
};

const DIFFICULTY: Record<string, [string, number][]> = {
  "startup-funding": [["easy", 0.2], ["medium", 0.5], ["hard", 0.3]],
  "climate-grant": [["easy", 0.15], ["medium", 0.45], ["hard", 0.4]],
  "research-grant": [["easy", 0.1], ["medium", 0.4], ["hard", 0.5]],
  "travel-grant": [["easy", 0.7], ["medium", 0.25], ["hard", 0.05]],
  scholarship: [["easy", 0.05], ["medium", 0.25], ["hard", 0.7]],
  fellowship: [["easy", 0.1], ["medium", 0.5], ["hard", 0.4]],
  competition: [["easy", 0.45], ["medium", 0.4], ["hard", 0.15]],
  "business-support": [["easy", 0.5], ["medium", 0.35], ["hard", 0.15]],
  "community-grant": [["easy", 0.6], ["medium", 0.3], ["hard", 0.1]],
  job: [["easy", 0.4], ["medium", 0.4], ["hard", 0.2]],
  "professional-development": [["easy", 0.6], ["medium", 0.3], ["hard", 0.1]],
};

const YOUTH_CATEGORIES = ["community-grant", "professional-development", "startup-funding", "scholarship", "fellowship"];

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedPick<T>(rng: Rng, entries: readonly [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, weight] of entries) {
    r -= weight;
    if (r < 0) return value;
  }
  return entries[entries.length - 1][0];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function fill(tpl: string, ctx: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => ctx[k] ?? m);
}

function shortName(rng: Rng, org: string): string {
  const known = SHORT_NAMES[org];
  if (known) return pick(rng, known);
  const words = org.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 3).join(" ") || org;
}

function orgSlug(org: string): string {
  return org.toLowerCase().replace(/[^a-z]+/g, "");
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function pickStep(rng: Rng, min: number, max: number): number {
  const steps = AMOUNT_STEPS.filter((s) => s >= min && s <= max);
  if (steps.length > 0) return pick(rng, steps);
  return Math.round(((min + max) / 2) / 500) * 500;
}

function makeAmount(category: string, rng: Rng): { amount: string | null; currency: string; low: number | null; high: number | null } {
  const fmt = (n: number) => n.toLocaleString("en-US");
  if (category === "job") return { amount: "Salary", currency: "FJD", low: null, high: null };
  if (category === "scholarship") {
    const r = rng();
    if (r < 0.3) return { amount: "Full tuition + stipend", currency: "FJD", low: null, high: null };
    if (r < 0.5) return { amount: "Full tuition", currency: "FJD", low: null, high: null };
    if (r < 0.6) return { amount: "Fees covered", currency: "FJD", low: null, high: null };
    const low = pickStep(rng, 3000, 8000);
    const high = pickStep(rng, low, 12000);
    return { amount: `FJD ${fmt(high)} / year`, currency: "FJD", low, high };
  }
  if (category === "fellowship") {
    const r = rng();
    if (r < 0.4) return { amount: "Funded place", currency: "FJD", low: null, high: null };
    if (r < 0.7) return { amount: "Stipend + travel", currency: "FJD", low: null, high: null };
    const low = pickStep(rng, 2000, 5000);
    const high = pickStep(rng, low, 8000);
    return { amount: `USD ${fmt(high)}`, currency: "USD", low, high };
  }
  if (category === "business-support" && rng() < 0.2) {
    return { amount: "Free programme", currency: "FJD", low: null, high: null };
  }
  if (category === "professional-development" && rng() < 0.1) {
    return { amount: "Full course fees", currency: "FJD", low: null, high: null };
  }
  const cfg = AMOUNT_CFG[category];
  const usd = rng() < cfg.usdChance;
  const prefix = usd ? "USD" : "FJD";
  const currency = usd ? "USD" : "FJD";
  const low = pickStep(rng, cfg.min, Math.floor(cfg.max * 0.4));
  const high = pickStep(rng, low, cfg.max);
  return { amount: `${prefix} ${fmt(high)}`, currency, low, high };
}

function makeAges(category: string, rng: Rng): { ageMin: number | null; ageMax: number | null } {
  if (YOUTH_CATEGORIES.includes(category) && rng() < 0.35) {
    const min = rng() < 0.5 ? 16 : 18;
    const max = category === "scholarship" ? (rng() < 0.5 ? 40 : 35) : 35;
    return { ageMin: min, ageMax: max };
  }
  if (category === "scholarship" && rng() < 0.25) {
    return { ageMin: 18, ageMax: rng() < 0.5 ? 40 : 45 };
  }
  return { ageMin: null, ageMax: null };
}

function makeDocs(category: string, rng: Rng): string[] {
  const pool = shuffle(rng, DOCS[category] ?? DOCS["community-grant"]);
  const r = rng();
  const n = r < 0.1 ? 1 : r < 0.35 ? 2 : r < 0.75 ? 3 : 4;
  return pool.slice(0, Math.min(n, pool.length));
}

function makeStages(category: string, rng: Rng): { name: string; description: string; order: number }[] {
  const pool = STAGES[category] ?? STAGES["community-grant"];
  const n = weightedPick<number>(rng, [[2, 0.15], [3, 0.4], [4, 0.3], [5, 0.15]]);
  return shuffle(rng, pool)
    .slice(0, Math.min(n, pool.length))
    .map((s, i) => ({ name: s.name, description: s.description, order: i + 1 }));
}

function makeFaq(category: string, rng: Rng): { question: string; answer: string }[] {
  if (rng() < 0.4) return [];
  const who = { question: "Who can apply?", answer: WHO_ANSWERS[category] ?? "Eligible applicants as set out in the guidelines." };
  if (rng() < 0.45) return [who];
  const extra = pick(rng, FAQ_POOL);
  return [who, extra];
}

function makeDescription(category: string, ctx: Record<string, string>, rng: Rng): string {
  const pool = DESCRIPTIONS[category] ?? DESCRIPTIONS["community-grant"];
  const n = 2 + Math.floor(rng() * 2);
  return shuffle(rng, pool)
    .slice(0, Math.min(n, pool.length))
    .map((s) => fill(s, ctx))
    .join(" ");
}

function makeTitle(rng: Rng, category: string, short: string, usedTitles: Set<string>): string {
  const templates = TITLE_TEMPLATES[category] ?? TITLE_TEMPLATES["community-grant"];
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 60; attempt++) {
    const ctx = {
      provider: short,
      place: pick(rng, PLACES),
      sector: pick(rng, SECTORS),
      noun: pick(rng, NOUNS[category] ?? NOUNS["community-grant"]),
      field: pick(rng, STUDY_FIELDS),
    };
    let title = fill(pick(rng, templates), ctx);
    if (rng() < 0.25) title = `${title} ${year}`;
    if (!usedTitles.has(title)) return title;
  }
  let i = 2;
  while (true) {
    const title = `${short} ${pick(rng, SECTORS)} ${pick(rng, NOUNS[category] ?? NOUNS["community-grant"])} (Series ${i})`;
    if (!usedTitles.has(title)) return title;
    i++;
  }
}

function makeSlug(title: string, usedSlugs: Set<string>): string {
  const base = slugifyTitle(title);
  let slug = base;
  let i = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}

function parseCount(): number {
  const idx = process.argv.indexOf("--count");
  if (idx >= 0 && process.argv[idx + 1]) {
    const n = parseInt(process.argv[idx + 1], 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 1800;
}

type ProviderRow = { id: string; organization: string };

function buildRow(
  rng: Rng,
  category: string,
  title: string,
  slug: string,
  provider: ProviderRow,
): Prisma.OpportunityCreateManyInput {
  const rolling = rng() < 0.3;
  const deadline = rolling ? null : daysFromNow(1 + Math.floor(Math.pow(rng(), 0.85) * 379));
  const place = pick(rng, PLACES);
  const sector = pick(rng, SECTORS);
  const field = pick(rng, STUDY_FIELDS);
  const ctx = { provider: shortName(rng, provider.organization), place, sector: sector.toLowerCase(), field };
  const countryScope = rng() < 0.6 ? "Fiji" : pick(rng, PACIFIC_SCOPES);
  const provSlug = orgSlug(provider.organization);
  const officialUrl = `https://example-${provSlug}.org/${slug}`;
  const applicationUrl = rng() < 0.7 ? `${officialUrl}/apply` : null;
  const { amount, currency, low, high } = makeAmount(category, rng);
  const verificationLevel = weightedPick<string>(rng, [["official", 0.5], ["partner", 0.3], ["community", 0.2]]);
  const hours = HOURS[category];
  const estimatedHours = hours[0] + Math.floor(rng() * (hours[1] - hours[0] + 1));
  const difficulty = weightedPick<string>(rng, DIFFICULTY[category] ?? DIFFICULTY["community-grant"]);
  const { ageMin, ageMax } = makeAges(category, rng);

  return {
    slug,
    title,
    providerId: provider.id,
    category,
    deadline,
    isRolling: rolling,
    countryScope,
    description: makeDescription(category, ctx, rng),
    officialUrl,
    applicationUrl,
    fundingAmount: amount,
    currency,
    amountLow: low,
    amountHigh: high,
    status: "published",
    verificationLevel,
    estimatedHours,
    difficulty,
    ageMin,
    ageMax,
    requiredDocuments: JSON.stringify(makeDocs(category, rng)),
    stages: JSON.stringify(makeStages(category, rng)),
    faq: JSON.stringify(makeFaq(category, rng)),
    sourceUrl: officialUrl,
    lastVerifiedAt: daysFromNow(-(1 + Math.floor(rng() * 13))),
  };
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

async function main() {
  const count = parseCount();

  const providers = await prisma.provider.findMany({ select: { id: true, organization: true } });
  if (providers.length === 0) throw new Error("No providers found in the database. Run the seed first.");

  const existing = await prisma.opportunity.findMany({ select: { slug: true, title: true } });
  const existingSlugs = new Set(existing.map((o) => o.slug));
  const existingTitles = new Set(existing.map((o) => o.title));

  const rng = mulberry32(20260807);
  const usedSlugs = new Set(existingSlugs);
  const usedTitles = new Set(existingTitles);

  const rows: Prisma.OpportunityCreateManyInput[] = [];
  let attempts = 0;
  while (rows.length < count && attempts < count * 100) {
    attempts++;
    const provider = pick(rng, providers);
    const category = weightedPick<string>(rng, CATEGORY_WEIGHTS);
    const short = shortName(rng, provider.organization);
    const title = makeTitle(rng, category, short, usedTitles);
    usedTitles.add(title);
    const slug = makeSlug(title, usedSlugs);
    usedSlugs.add(slug);
    rows.push(buildRow(rng, category, title, slug, provider));
  }

  const inserted = rows.length;
  const batchSize = 500;
  for (let i = 0; i < inserted; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    await prisma.opportunity.createMany({ data: chunk });
  }

  const total = await prisma.opportunity.count();

  console.log(`Generating ${count} catalogue opportunities...`);
  console.log(`  Attempted: ${count}`);
  console.log(`  Inserted:  ${inserted}`);
  console.log(`  Total opportunities now: ${total}`);
  console.log(`Sample titles:`);
  for (const row of rows.slice(0, 5)) {
    console.log(`  - ${row.title} (${row.category})`);
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
