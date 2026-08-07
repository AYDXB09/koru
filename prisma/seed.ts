import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

type Rule = {
  field: string;
  operator: string;
  value: unknown;
  required?: boolean;
  label?: string;
};

type Stage = { name: string; description: string; order: number };
type Faq = { question: string; answer: string };

type OpportunitySeed = {
  slug: string;
  title: string;
  provider: string;
  category: string;
  deadline?: Date;
  isRolling?: boolean;
  description: string;
  officialUrl?: string;
  applicationUrl?: string;
  fundingAmount?: string;
  currency?: string;
  amountLow?: number;
  amountHigh?: number;
  verificationLevel: string;
  estimatedHours: number;
  difficulty: string;
  ageMin?: number;
  ageMax?: number;
  requiredDocuments: string[];
  stages?: Stage[];
  faq?: Faq[];
  rules?: Rule[];
};

/**
 * The Koru catalogue. Curated from published Fijian and Pacific funding
 * sources. Deliberately overlaps in places (several funders run similar
 * climate or youth schemes) because that is what the real landscape looks
 * like — Koru keeps them separate and lets matching sort them out.
 */
const OPPORTUNITIES: OpportunitySeed[] = [
  // ---------------------------------------------------------------- startup
  {
    slug: "fiji-startup-challenge-2026",
    title: "Fiji Startup Challenge 2026",
    provider: "Fiji Commerce & Employers Federation",
    category: "startup-funding",
    deadline: daysFromNow(62),
    description:
      "An annual pitch competition supporting Fijian-owned startups and small businesses with grant funding, mentorship and investor introductions. Early-stage ventures in tourism, agriculture and technology are strongly encouraged to apply.",
    officialUrl: "https://fcef.com.fj/startup-challenge",
    applicationUrl: "https://fcef.com.fj/startup-challenge/apply",
    fundingAmount: "FJD 50,000",
    currency: "FJD",
    amountLow: 20000,
    amountHigh: 50000,
    verificationLevel: "official",
    estimatedHours: 12,
    difficulty: "hard",
    ageMin: 18,
    requiredDocuments: ["Business registration", "CV", "Proposal", "Budget template", "Tax certificate (TIN)"],
    stages: [
      { name: "Online application", description: "Company profile, pitch summary and 2-minute video.", order: 1 },
      { name: "Shortlist review", description: "Applicants are shortlisted for a 10-minute pitch.", order: 2 },
      { name: "Live pitch final", description: "Finalists pitch to the judging panel in Suva.", order: 3 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Fijian-owned startups and SMEs registered in Fiji, at least 18 years old." },
      { question: "What does the funding cover?", answer: "Grant funding of FJD 20,000–50,000 plus six months of mentorship." },
    ],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "organizationType", operator: "in", value: ["Startup", "SME"], label: "Startup or SME" },
      { field: "sector", operator: "has", value: ["Tourism", "Agriculture", "ICT / Technology"], label: "Tourism, agriculture or technology sector" },
      { field: "documentsAvailable", operator: "hasAll", value: ["business-registration"], label: "Business registration on hand" },
    ],
  },
  {
    slug: "youth-colab-fiji-bootcamp",
    title: "Youth Co:Lab Fiji Bootcamp",
    provider: "UNDP Pacific Office in Fiji",
    category: "startup-funding",
    deadline: daysFromNow(38),
    description:
      "A five-day bootcamp for young Fijians aged 18–30 turning an early idea into a small venture. Includes a pitch round where the top teams receive seed funding and three months of coaching.",
    officialUrl: "https://www.undp.org/pacific/youth-colab",
    fundingAmount: "FJD 12,000",
    currency: "FJD",
    amountLow: 3000,
    amountHigh: 12000,
    verificationLevel: "official",
    estimatedHours: 10,
    difficulty: "medium",
    ageMin: 18,
    ageMax: 30,
    requiredDocuments: ["National ID", "CV", "Proposal"],
    stages: [
      { name: "Apply online", description: "Idea summary and one-minute video.", order: 1 },
      { name: "Bootcamp", description: "Five days of workshops and mentoring in Suva.", order: 2 },
      { name: "Pitch day", description: "Top teams pitch for seed funding.", order: 3 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Fijian citizens aged 18–30 with an early-stage idea." },
      { question: "Do I need a registered business?", answer: "No, but winners are asked to register within a year." },
    ],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "age", operator: "lte", value: 30, label: "30 years or younger" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "fundingInterests", operator: "has", value: ["startup", "innovation"], label: "Startup or innovation interest" },
    ],
  },
  {
    slug: "pacific-digital-economy-accelerator",
    title: "Pacific Digital Economy Accelerator",
    provider: "Pacific Islands Forum Secretariat",
    category: "startup-funding",
    deadline: daysFromNow(52),
    description:
      "A regional accelerator for Pacific technology startups, providing seed funding, mentorship and access to regional markets. Open to ventures in e-commerce, fintech, agritech and digital services.",
    officialUrl: "https://www.forumsec.org/digital-economy",
    fundingAmount: "USD 25,000",
    currency: "USD",
    amountLow: 10000,
    amountHigh: 25000,
    verificationLevel: "partner",
    estimatedHours: 12,
    difficulty: "medium",
    requiredDocuments: ["Business registration", "Proposal", "CV"],
    stages: [
      { name: "Expression of interest", description: "Short form covering your product and market.", order: 1 },
      { name: "Interview", description: "Video call with the selection panel.", order: 2 },
      { name: "Programme", description: "12 weeks of residency and mentorship.", order: 3 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Technology startups based in Pacific island countries." },
      { question: "Is it remote?", answer: "Cohorts run hybrid with an in-person week in Suva." },
    ],
    rules: [
      { field: "organizationType", operator: "in", value: ["Startup", "SME"], label: "Startup or SME" },
      { field: "sector", operator: "has", value: ["ICT / Technology"], label: "Technology sector" },
      { field: "fundingInterests", operator: "has", value: ["startup", "business", "innovation"], label: "Startup or innovation interest" },
    ],
  },
  {
    slug: "blue-economy-innovation-fund",
    title: "Blue Economy Innovation Fund",
    provider: "Pacific Islands Forum Secretariat",
    category: "startup-funding",
    isRolling: true,
    description:
      "Seed funding for coastal businesses building sustainable fisheries, aquaculture and marine services in the Pacific. Rolling intake with quarterly review panels.",
    officialUrl: "https://www.forumsec.org/blue-economy",
    fundingAmount: "USD 15,000",
    currency: "USD",
    amountLow: 5000,
    amountHigh: 15000,
    verificationLevel: "partner",
    estimatedHours: 8,
    difficulty: "medium",
    requiredDocuments: ["Business registration", "Proposal", "Budget template"],
    rules: [
      { field: "organizationType", operator: "in", value: ["Startup", "SME", "Community group"], label: "Startup, SME or community group" },
      { field: "sector", operator: "has", value: ["Fisheries", "Climate & Environment"], label: "Fisheries or marine sector" },
      { field: "fundingInterests", operator: "has", value: ["business", "climate"], label: "Business or climate interest" },
    ],
  },
  {
    slug: "fcoss-social-enterprise-seed-fund",
    title: "FCOSS Social Enterprise Seed Fund",
    provider: "FCOSS",
    category: "startup-funding",
    deadline: daysFromNow(45),
    description:
      "Seed grants for social enterprises and cooperatives in Fiji with a clear community mission. Preference for ventures creating local jobs and reinvesting profit.",
    officialUrl: "https://www.fcoss.org.fj/seed-fund",
    fundingAmount: "FJD 9,000",
    currency: "FJD",
    amountLow: 3000,
    amountHigh: 9000,
    verificationLevel: "partner",
    estimatedHours: 7,
    difficulty: "easy",
    requiredDocuments: ["Business registration", "Proposal", "Budget template"],
    rules: [
      { field: "organizationType", operator: "in", value: ["Startup", "SME", "NGO", "Community group"], label: "Social enterprise or community group" },
      { field: "sector", operator: "has", value: ["Community Development", "Agriculture", "Creative Industries"], label: "Community-focused sector" },
    ],
  },
  {
    slug: "agripacific-innovation-challenge",
    title: "AgriPacific Innovation Challenge",
    provider: "Fiji Commerce & Employers Federation",
    category: "competition",
    deadline: daysFromNow(33),
    description:
      "A national competition for farmers, students and agritech builders. Prize funding for the strongest solutions to farm productivity, post-harvest loss and market access in Fiji.",
    officialUrl: "https://fcef.com.fj/agripacific",
    fundingAmount: "FJD 20,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 20000,
    verificationLevel: "official",
    estimatedHours: 9,
    difficulty: "medium",
    requiredDocuments: ["Proposal", "CV"],
    stages: [
      { name: "Submit solution", description: "Written entry plus a short video.", order: 1 },
      { name: "Field demo", description: "Shortlisted teams demo in their own context.", order: 2 },
    ],
    faq: [
      { question: "Who can enter?", answer: "Individuals, students, startups and cooperatives in Fiji." },
      { question: "What wins?", answer: "Entries judged on practicality, cost and reach." },
    ],
    rules: [
      { field: "sector", operator: "has", value: ["Agriculture", "ICT / Technology"], label: "Agriculture or technology sector" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "fundingInterests", operator: "has", value: ["innovation", "startup"], label: "Innovation or startup interest" },
    ],
  },

  // ------------------------------------------------------------------ climate
  {
    slug: "undp-pacific-community-innovation-grant",
    title: "UNDP Pacific Community Innovation Grant",
    provider: "UNDP Pacific Office in Fiji",
    category: "climate-grant",
    deadline: daysFromNow(88),
    description:
      "Small grants for community organisations and NGOs in Fiji piloting climate-resilient and community-led solutions. Supports locally driven projects with a focus on sustainability and measurable local impact.",
    officialUrl: "https://www.undp.org/pacific",
    fundingAmount: "USD 25,000",
    currency: "USD",
    amountLow: 10000,
    amountHigh: 25000,
    verificationLevel: "official",
    estimatedHours: 15,
    difficulty: "hard",
    requiredDocuments: ["Proposal", "Budget template", "Tax certificate (TIN)", "CV"],
    stages: [
      { name: "Concept note", description: "Two-page concept note describing the project.", order: 1 },
      { name: "Full proposal", description: "Detailed proposal and budget for shortlisted applicants.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Registered NGOs, community groups and civil society organisations in Fiji." },
      { question: "What sectors are funded?", answer: "Climate adaptation, waste management, water and community development." },
    ],
    rules: [
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "organizationType", operator: "in", value: ["NGO", "Community group"], label: "NGO or community group" },
      { field: "sector", operator: "has", value: ["Climate & Environment", "Waste Management", "Community Development"], label: "Climate, waste or community sector" },
      { field: "documentsAvailable", operator: "hasAll", value: ["tax-certificate"], label: "Tax certificate on hand" },
    ],
  },
  {
    slug: "spc-climate-adaptation-small-grants",
    title: "SPC Climate Adaptation Small Grants",
    provider: "Pacific Community (SPC)",
    category: "climate-grant",
    deadline: daysFromNow(103),
    description:
      "Small grants supporting community-led climate adaptation and nature-based solutions in Pacific island countries, including early warning, coastal protection and resilient agriculture.",
    officialUrl: "https://www.spc.int/climate-grants",
    fundingAmount: "USD 20,000",
    currency: "USD",
    amountLow: 8000,
    amountHigh: 20000,
    verificationLevel: "official",
    estimatedHours: 16,
    difficulty: "hard",
    requiredDocuments: ["Proposal", "Budget template", "Tax certificate (TIN)"],
    stages: [
      { name: "Concept note", description: "Outline the adaptation activity.", order: 1 },
      { name: "Full application", description: "Detailed plan, budget and community endorsement.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Community groups, NGOs and academic institutions in Pacific countries." },
      { question: "What is the funding range?", answer: "USD 8,000–20,000 per project." },
    ],
    rules: [
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "sector", operator: "has", value: ["Climate & Environment", "Agriculture", "Fisheries"], label: "Climate, agriculture or fisheries" },
      { field: "organizationType", operator: "in", value: ["NGO", "Community group", "Academic"], label: "NGO, community group or academic" },
    ],
  },
  {
    slug: "gef-sgp-fiji-community-climate-grants",
    title: "GEF SGP Fiji Community Climate Grants",
    provider: "Global Environment Facility SGP",
    category: "climate-grant",
    deadline: daysFromNow(71),
    description:
      "Community-level grants from the GEF Small Grants Programme for projects addressing climate resilience, biodiversity and land restoration in Fiji's villages and settlements.",
    officialUrl: "https://sgp.undp.org/fiji",
    fundingAmount: "USD 10,000",
    currency: "USD",
    amountLow: 4000,
    amountHigh: 10000,
    verificationLevel: "official",
    estimatedHours: 10,
    difficulty: "medium",
    requiredDocuments: ["Proposal", "Budget template", "Bank statement"],
    stages: [
      { name: "Project outline", description: "Short form plus a community letter of support.", order: 1 },
      { name: "Full application", description: "Detailed plan and budget.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Village groups, community-based organisations and NGOs in Fiji." },
      { question: "How are grants paid?", answer: "In tranches against agreed milestones." },
    ],
    rules: [
      { field: "organizationType", operator: "in", value: ["NGO", "Community group"], label: "NGO or community group" },
      { field: "sector", operator: "has", value: ["Climate & Environment", "Agriculture", "Water & Sanitation"], label: "Climate, agriculture or water" },
      { field: "documentsAvailable", operator: "hasAll", value: ["bank-statement"], label: "Bank account statement" },
    ],
  },
  {
    slug: "green-climate-fund-fiji-readiness-grant",
    title: "Green Climate Fund Fiji Readiness Grant",
    provider: "Pacific Community (SPC)",
    category: "climate-grant",
    deadline: daysFromNow(95),
    description:
      "Readiness support for government and civil society partners to strengthen climate finance pipelines and adaptation planning in Fiji. Larger grants aimed at organisations that can run multi-site projects.",
    officialUrl: "https://www.greenclimate.fund/countries/fiji",
    fundingAmount: "USD 50,000",
    currency: "USD",
    amountLow: 20000,
    amountHigh: 50000,
    verificationLevel: "official",
    estimatedHours: 20,
    difficulty: "hard",
    requiredDocuments: ["Proposal", "Budget template", "Tax certificate (TIN)"],
    rules: [
      { field: "sector", operator: "has", value: ["Climate & Environment"], label: "Climate sector" },
      { field: "organizationType", operator: "in", value: ["NGO", "Community group", "Government", "Academic"], label: "Eligible organisation types" },
      { field: "fundingInterests", operator: "has", value: ["climate", "environment"], label: "Climate interest" },
    ],
  },
  {
    slug: "spc-water-resilience-fund",
    title: "SPC Water Resilience Fund",
    provider: "Pacific Community (SPC)",
    category: "community-grant",
    deadline: daysFromNow(58),
    description:
      "Grants for rural and island communities in Fiji improving water security: catchment protection, rainwater harvesting and small-scale storage built with local labour.",
    officialUrl: "https://www.spc.int/water-resilience",
    fundingAmount: "FJD 15,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 15000,
    verificationLevel: "official",
    estimatedHours: 9,
    difficulty: "medium",
    requiredDocuments: ["Proposal", "Budget template"],
    stages: [
      { name: "Community proposal", description: "Describe the water problem and your plan.", order: 1 },
      { name: "Site visit", description: "SPC team confirms feasibility and community support.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Rural and island communities in Fiji represented by a local group or council." },
      { question: "What is covered?", answer: "Materials, transport and a small labour allowance." },
    ],
    rules: [
      { field: "organizationType", operator: "in", value: ["Community group", "NGO"], label: "Community group or NGO" },
      { field: "sector", operator: "has", value: ["Water & Sanitation", "Climate & Environment"], label: "Water or climate sector" },
    ],
  },

  // ----------------------------------------------------------------- research
  {
    slug: "usp-postgraduate-research-grant",
    title: "USP Postgraduate Research Grant",
    provider: "University of the South Pacific",
    category: "research-grant",
    deadline: daysFromNow(124),
    description:
      "Research funding for postgraduate students at the University of the South Pacific undertaking fieldwork and research relevant to Pacific development, climate change, marine science and Pacific economies.",
    officialUrl: "https://www.usp.ac.fj/research/grants",
    fundingAmount: "FJD 15,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 15000,
    verificationLevel: "official",
    estimatedHours: 10,
    difficulty: "medium",
    requiredDocuments: ["Academic transcript", "CV", "Proposal", "Recommendation letter"],
    stages: [
      { name: "Research proposal", description: "Submit your research proposal and methodology.", order: 1 },
      { name: "Review", description: "Faculty review and interview.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Postgraduate (Master's or PhD) students enrolled at USP." },
      { question: "What is the maximum award?", answer: "FJD 15,000 per project." },
    ],
    rules: [
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "citizenship", operator: "in", value: ["Fijian", "Other"], label: "Open to Pacific students" },
      { field: "fundingInterests", operator: "has", value: ["research", "study", "academic"], label: "Research interest" },
      { field: "sector", operator: "has", value: ["Research", "Climate & Environment", "Fisheries"], label: "Research-related sector" },
    ],
  },
  {
    slug: "fiji-national-research-council-grant",
    title: "Fiji National Research Council Grant",
    provider: "Fiji Civil Service",
    category: "research-grant",
    deadline: daysFromNow(66),
    description:
      "Funding for applied research addressing national priorities in agriculture, health and climate resilience. Open to researchers, institutions and research teams working in Fiji.",
    officialUrl: "https://www.research.gov.fj",
    fundingAmount: "FJD 25,000",
    currency: "FJD",
    amountLow: 10000,
    amountHigh: 25000,
    verificationLevel: "official",
    estimatedHours: 14,
    difficulty: "hard",
    requiredDocuments: ["Proposal", "CV", "Academic transcript"],
    rules: [
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "sector", operator: "has", value: ["Research", "Agriculture", "Climate & Environment", "Health"], label: "Research-related sector" },
    ],
  },
  {
    slug: "fnu-applied-research-seed-grant",
    title: "FNU Applied Research Seed Grant",
    provider: "Fiji National University",
    category: "research-grant",
    deadline: daysFromNow(42),
    description:
      "Seed grants for FNU staff and students piloting applied research with industry or community partners, especially in technical and vocational fields.",
    officialUrl: "https://www.fnu.ac.fj/research",
    fundingAmount: "FJD 8,000",
    currency: "FJD",
    amountLow: 2000,
    amountHigh: 8000,
    verificationLevel: "official",
    estimatedHours: 6,
    difficulty: "easy",
    requiredDocuments: ["Academic transcript", "Proposal", "CV"],
    faq: [{ question: "Who can apply?", answer: "FNU staff and enrolled students with a faculty sponsor." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["Academic"], label: "Academic affiliation" },
      { field: "fundingInterests", operator: "has", value: ["research", "study"], label: "Research interest" },
    ],
  },
  {
    slug: "spc-marine-research-small-grants",
    title: "SPC Marine Research Small Grants",
    provider: "Pacific Community (SPC)",
    category: "research-grant",
    deadline: daysFromNow(117),
    description:
      "Small research grants for coastal and marine studies in Pacific waters, covering reef monitoring, fisheries stock work and community marine management.",
    officialUrl: "https://www.spc.int/marine-science",
    fundingAmount: "USD 12,000",
    currency: "USD",
    amountLow: 4000,
    amountHigh: 12000,
    verificationLevel: "official",
    estimatedHours: 12,
    difficulty: "medium",
    requiredDocuments: ["Proposal", "CV", "Academic transcript"],
    rules: [
      { field: "sector", operator: "has", value: ["Fisheries", "Research", "Climate & Environment"], label: "Marine, fisheries or research sector" },
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "fundingInterests", operator: "has", value: ["research", "climate", "environment"], label: "Research or environment interest" },
    ],
  },
  {
    slug: "ilo-decent-work-research-bursary",
    title: "ILO Decent Work Research Bursary",
    provider: "International Labour Organization",
    category: "research-grant",
    deadline: daysFromNow(28),
    description:
      "Bursaries for researchers examining labour markets, informal work and youth employment in Fiji. Findings are published as Pacific policy briefs.",
    officialUrl: "https://www.ilo.org/pacific",
    fundingAmount: "USD 6,000",
    currency: "USD",
    amountLow: 2000,
    amountHigh: 6000,
    verificationLevel: "official",
    estimatedHours: 8,
    difficulty: "medium",
    requiredDocuments: ["Proposal", "CV", "Recommendation letter"],
    rules: [
      { field: "sector", operator: "has", value: ["Research", "Community Development"], label: "Research or social sector" },
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "fundingInterests", operator: "has", value: ["research", "community"], label: "Research or community interest" },
    ],
  },

  // ---------------------------------------------------------------- travel
  {
    slug: "usp-pacific-scholars-travel-award",
    title: "USP Pacific Scholars Travel Award",
    provider: "University of the South Pacific",
    category: "travel-grant",
    deadline: daysFromNow(27),
    description:
      "Support for USP students presenting at international conferences and research symposia, covering travel and accommodation.",
    officialUrl: "https://www.usp.ac.fj/travel-award",
    fundingAmount: "FJD 5,000",
    currency: "FJD",
    amountLow: 1000,
    amountHigh: 5000,
    verificationLevel: "official",
    estimatedHours: 4,
    difficulty: "easy",
    requiredDocuments: ["CV", "Academic transcript", "Proposal"],
    rules: [
      { field: "education", operator: "gte", value: "Diploma", label: "Diploma or higher" },
      { field: "fundingInterests", operator: "has", value: ["travel", "conference", "study"], label: "Conference or travel interest" },
    ],
  },
  {
    slug: "forum-conference-participation-grant",
    title: "PIFS Conference Participation Grant",
    provider: "Pacific Islands Forum Secretariat",
    category: "travel-grant",
    deadline: daysFromNow(49),
    description:
      "Travel and registration support for Fijian civil society delegates attending Pacific regional conferences, forums and consultation meetings.",
    officialUrl: "https://www.forumsec.org/participation-grants",
    fundingAmount: "USD 3,000",
    currency: "USD",
    amountLow: 500,
    amountHigh: 3000,
    verificationLevel: "partner",
    estimatedHours: 3,
    difficulty: "easy",
    requiredDocuments: ["CV", "Recommendation letter"],
    faq: [{ question: "Who can apply?", answer: "Representatives of registered Pacific civil society organisations." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["NGO", "Community group", "Government"], label: "Civil society or public sector" },
      { field: "fundingInterests", operator: "has", value: ["travel", "conference", "community"], label: "Travel or community interest" },
    ],
  },
  {
    slug: "fiji-arts-council-travel-grant",
    title: "Fiji Arts Council Exhibition Travel Grant",
    provider: "Fiji Arts Council",
    category: "travel-grant",
    isRolling: true,
    description:
      "Travel grants for Fijian artists and curators exhibiting or performing abroad, covering freight of works, travel and accommodation. Reviewed every two months.",
    officialUrl: "https://www.artscouncil.gov.fj/travel",
    fundingAmount: "FJD 4,000",
    currency: "FJD",
    amountLow: 1000,
    amountHigh: 4000,
    verificationLevel: "official",
    estimatedHours: 4,
    difficulty: "easy",
    requiredDocuments: ["CV", "Portfolio", "Proposal"],
    rules: [
      { field: "sector", operator: "has", value: ["Creative Industries"], label: "Creative industries sector" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
    ],
  },

  // -------------------------------------------------------------- scholarship
  {
    slug: "australia-awards-fiji-scholarship",
    title: "Australia Awards Fiji Postgraduate Scholarship",
    provider: "Australia Awards",
    category: "scholarship",
    deadline: daysFromNow(47),
    description:
      "Full scholarships for Fijian citizens to study postgraduate programs in Australia in priority development areas including agriculture, health, infrastructure and public policy.",
    officialUrl: "https://www.australiaawardsfiji.org",
    applicationUrl: "https://oasis.dfat.gov.au",
    fundingAmount: "Full tuition + stipend",
    verificationLevel: "official",
    estimatedHours: 20,
    difficulty: "hard",
    ageMin: 18,
    ageMax: 45,
    requiredDocuments: ["Passport", "Academic transcript", "CV", "Recommendation letter"],
    stages: [
      { name: "Online application", description: "Complete the online application in OASIS.", order: 1 },
      { name: "Shortlisting", description: "Written assessment and supporting documents.", order: 2 },
      { name: "Interview", description: "Panel interview with Australia Awards Fiji.", order: 3 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Fijian citizens aged 18–45 with relevant qualifications and work experience." },
      { question: "What is covered?", answer: "Full tuition, return airfare, living allowance and health insurance." },
      { question: "Do I need to return to Fiji?", answer: "Awardees commit to returning to Fiji for at least two years after study." },
    ],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "age", operator: "lte", value: 45, label: "45 years or younger" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "gte", value: "Certificate", label: "Minimum qualification" },
      { field: "employmentStatus", operator: "in", value: ["Student", "Employed", "Self-employed"], label: "Currently studying or working" },
    ],
  },
  {
    slug: "manaaki-nz-scholarship",
    title: "Manaaki New Zealand Scholarship",
    provider: "Manaaki New Zealand Scholarships",
    category: "scholarship",
    deadline: daysFromNow(56),
    description:
      "Scholarships from the New Zealand government for Fijians studying tertiary qualifications in New Zealand, with a focus on development-related fields and climate resilience.",
    officialUrl: "https://www.manaakischolarships.co.nz",
    fundingAmount: "Full tuition + stipend",
    verificationLevel: "official",
    estimatedHours: 18,
    difficulty: "hard",
    ageMin: 18,
    ageMax: 40,
    requiredDocuments: ["Passport", "Academic transcript", "CV", "Recommendation letter"],
    stages: [
      { name: "Online application", description: "Profile, proposed study and references.", order: 1 },
      { name: "Eligibility check", description: "Country team verifies eligibility.", order: 2 },
      { name: "Final selection", description: "Nominations reviewed in Wellington.", order: 3 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Fijian citizens aged 18–40 with a strong study plan." },
      { question: "What does it cover?", answer: "Tuition, travel, stipend and accommodation support." },
    ],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "age", operator: "lte", value: 40, label: "40 years or younger" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "gte", value: "Diploma", label: "Diploma or higher" },
    ],
  },
  {
    slug: "jds-japan-scholarship",
    title: "JDS Japan Scholarship",
    provider: "Japan International Cooperation Agency (JICA)",
    category: "scholarship",
    deadline: daysFromNow(39),
    description:
      "Fully funded master's study in Japan for young Fijian public servants and development professionals, focusing on public administration, economics and infrastructure.",
    officialUrl: "https://www.jds.go.jp/fiji",
    fundingAmount: "Full tuition + stipend",
    verificationLevel: "official",
    estimatedHours: 15,
    difficulty: "hard",
    ageMax: 40,
    requiredDocuments: ["Passport", "Academic transcript", "CV", "Recommendation letter", "Employment letter"],
    stages: [
      { name: "Application", description: "Documents plus study plan.", order: 1 },
      { name: "Written exam", description: "Sit the JDS exam in Suva.", order: 2 },
      { name: "Interview", description: "Panel interview in Suva.", order: 3 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Fijian citizens aged under 40 with at least two years of relevant work experience." },
      { question: "Where do I study?", answer: "At partner graduate schools in Japan." },
    ],
    rules: [
      { field: "age", operator: "lte", value: 40, label: "40 years or younger" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "employmentStatus", operator: "in", value: ["Employed", "Self-employed"], label: "Currently working" },
    ],
  },
  {
    slug: "commonwealth-shared-scholarship",
    title: "Commonwealth Shared Scholarship",
    provider: "Commonwealth Scholarship Commission",
    category: "scholarship",
    deadline: daysFromNow(83),
    description:
      "Shared scholarships covering tuition and living costs for master's study in the United Kingdom. Open to Fijians in fields aligned with development priorities.",
    officialUrl: "https://cscuk.fcdo.gov.uk",
    fundingAmount: "Full tuition + stipend",
    verificationLevel: "official",
    estimatedHours: 16,
    difficulty: "hard",
    requiredDocuments: ["Passport", "Academic transcript", "CV", "Recommendation letter"],
    faq: [{ question: "Who can apply?", answer: "Fijian citizens who could not otherwise afford to study in the UK." }],
    rules: [
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "fundingInterests", operator: "has", value: ["study", "scholarship"], label: "Study or scholarship interest" },
    ],
  },
  {
    slug: "china-pacific-scholarship",
    title: "China Pacific Scholarship",
    provider: "Ministry of Education (China)",
    category: "scholarship",
    deadline: daysFromNow(64),
    description:
      "Scholarships for Pacific students to pursue degree programs in China, administered through the Ministry of Education, with a language year for students not yet fluent in Chinese.",
    officialUrl: "https://www.csc.edu.cn/pacific",
    fundingAmount: "Full tuition + stipend",
    verificationLevel: "official",
    estimatedHours: 12,
    difficulty: "medium",
    requiredDocuments: ["Passport", "Academic transcript", "CV", "Health certificate"],
    faq: [{ question: "Who can apply?", answer: "Pacific citizens aged 18–35 with completed secondary education." }],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "gte", value: "Secondary", label: "Secondary education or higher" },
    ],
  },
  {
    slug: "usp-regional-scholarship",
    title: "USP Regional Scholarship",
    provider: "University of the South Pacific",
    category: "scholarship",
    deadline: daysFromNow(101),
    description:
      "Tuition scholarships for students from USP member countries, including Fiji, covering up to full fees for undergraduate and postgraduate study at USP campuses.",
    officialUrl: "https://www.usp.ac.fj/scholarships",
    fundingAmount: "Full tuition",
    verificationLevel: "official",
    estimatedHours: 8,
    difficulty: "easy",
    requiredDocuments: ["Academic transcript", "CV", "Recommendation letter"],
    faq: [{ question: "Who can apply?", answer: "Citizens of USP member countries with strong academic records." }],
    rules: [
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "gte", value: "Diploma", label: "Diploma or higher" },
      { field: "fundingInterests", operator: "has", value: ["study", "scholarship", "academic"], label: "Study interest" },
    ],
  },
  {
    slug: "fnu-foundation-scholarship",
    title: "FNU Foundation Scholarship",
    provider: "Fiji National University",
    category: "scholarship",
    deadline: daysFromNow(19),
    description:
      "Foundation scholarships for Fijian students entering FNU certificate, diploma and degree programs, awarded on academic merit and financial need.",
    officialUrl: "https://www.fnu.ac.fj/scholarships",
    fundingAmount: "FJD 6,000",
    currency: "FJD",
    amountLow: 2000,
    amountHigh: 6000,
    verificationLevel: "official",
    estimatedHours: 4,
    difficulty: "easy",
    requiredDocuments: ["Academic transcript", "National ID", "Recommendation letter"],
    faq: [{ question: "Who can apply?", answer: "Fijian students applying to or enrolled at FNU." }],
    rules: [
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "in", value: ["Secondary", "Certificate", "Diploma"], label: "Secondary or early tertiary" },
      { field: "documentsAvailable", operator: "hasAll", value: ["id"], label: "National ID on hand" },
    ],
  },
  {
    slug: "bakani-family-foundation-scholarship",
    title: "Bakani Family Foundation Youth Scholarship",
    provider: "Bakani Family Foundation",
    category: "scholarship",
    deadline: daysFromNow(44),
    description:
      "Merit-based scholarships for outstanding Fijian secondary students entering tertiary study in STEM and business fields.",
    officialUrl: "https://www.bakanifoundation.fj",
    fundingAmount: "FJD 12,000 / year",
    currency: "FJD",
    amountLow: 6000,
    amountHigh: 12000,
    verificationLevel: "community",
    estimatedHours: 8,
    difficulty: "medium",
    requiredDocuments: ["Academic transcript", "Recommendation letter", "CV"],
    rules: [
      { field: "age", operator: "lte", value: 24, label: "24 years or younger" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "in", value: ["Secondary", "Certificate", "Diploma", "Bachelor's"], label: "Secondary or tertiary" },
    ],
  },
  {
    slug: "taiwan-pacific-student-scholarship",
    title: "Taiwan Scholarship for Pacific Students",
    provider: "Ministry of Education (China)",
    category: "scholarship",
    deadline: daysFromNow(71),
    description:
      "Scholarships for Pacific students to study bachelor's or master's programs in Taiwan, including a Chinese language year. Applications go through the Taipei Trade Mission in Suva.",
    officialUrl: "https://www.taiwan-scholarship.org",
    fundingAmount: "Tuition + monthly stipend",
    verificationLevel: "official",
    estimatedHours: 10,
    difficulty: "medium",
    requiredDocuments: ["Passport", "Academic transcript", "CV", "Recommendation letter"],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "education", operator: "gte", value: "Secondary", label: "Secondary education or higher" },
    ],
  },

  // --------------------------------------------------------------- fellowship
  {
    slug: "young-pacific-leaders-fellowship",
    title: "Young Pacific Leaders Fellowship",
    provider: "Pacific Community (SPC)",
    category: "fellowship",
    deadline: daysFromNow(74),
    description:
      "A leadership development fellowship for young professionals and community leaders across the Pacific, combining online coursework, an in-person workshop and a regional project.",
    officialUrl: "https://www.spc.int/young-pacific-leaders",
    fundingAmount: "Funded place",
    verificationLevel: "partner",
    estimatedHours: 14,
    difficulty: "medium",
    ageMin: 18,
    ageMax: 35,
    requiredDocuments: ["Passport", "CV", "Recommendation letter"],
    stages: [
      { name: "Application form", description: "Profile, motivation and leadership questions.", order: 1 },
      { name: "Reference check", description: "One referee is contacted.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Pacific citizens aged 18–35 active in their communities." },
      { question: "Is the fellowship funded?", answer: "Yes, successful fellows attend at no cost." },
    ],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "age", operator: "lte", value: 35, label: "35 years or younger" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "fundingInterests", operator: "has", value: ["leadership", "development"], label: "Leadership interest" },
    ],
  },
  {
    slug: "acacia-pacific-leadership",
    title: "Acacia Pacific Leadership Programme",
    provider: "Acacia Foundation",
    category: "fellowship",
    deadline: daysFromNow(90),
    description:
      "A six-month leadership programme for early-career Pacific professionals, pairing each fellow with a mentor and a real organisational project to lead.",
    officialUrl: "https://www.acaciafoundation.org/pacific",
    fundingAmount: "Funded place",
    verificationLevel: "community",
    estimatedHours: 12,
    difficulty: "medium",
    ageMin: 22,
    ageMax: 35,
    requiredDocuments: ["CV", "Recommendation letter", "Proposal"],
    rules: [
      { field: "age", operator: "gte", value: 22, label: "22 years or older" },
      { field: "age", operator: "lte", value: 35, label: "35 years or younger" },
      { field: "fundingInterests", operator: "has", value: ["leadership", "development", "community"], label: "Leadership interest" },
    ],
  },
  {
    slug: "rotary-peace-fellowship-fiji",
    title: "Rotary Peace Fellowship",
    provider: "Rotary Peace Center, USP",
    category: "fellowship",
    deadline: daysFromNow(110),
    description:
      "Fully funded professional development certificate in peace and conflict studies at the Rotary Peace Center at USP in Suva, open to practitioners from the Pacific region.",
    officialUrl: "https://www.rotary.org/en/peace-centers",
    fundingAmount: "Full funding",
    verificationLevel: "official",
    estimatedHours: 15,
    difficulty: "hard",
    ageMin: 25,
    requiredDocuments: ["CV", "Recommendation letter", "Passport", "Academic transcript"],
    stages: [
      { name: "Online application", description: "Full application on Rotary's portal.", order: 1 },
      { name: "References", description: "Three references submitted.", order: 2 },
    ],
    faq: [{ question: "Who can apply?", answer: "Mid-career professionals aged 25+ working in peacebuilding or development." }],
    rules: [
      { field: "age", operator: "gte", value: 25, label: "25 years or older" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "fundingInterests", operator: "has", value: ["leadership", "development", "community"], label: "Leadership or community interest" },
    ],
  },
  {
    slug: "asia-foundation-pacific-emerging-leaders",
    title: "Asia Foundation Pacific Emerging Leaders",
    provider: "The Asia Foundation",
    category: "fellowship",
    deadline: daysFromNow(37),
    description:
      "A leadership fellowship for emerging civil society and private sector leaders in the Pacific, with a regional convening and a small project grant.",
    officialUrl: "https://asiafoundation.org/pacific",
    fundingAmount: "USD 5,000 + travel",
    currency: "USD",
    amountLow: 2000,
    amountHigh: 5000,
    verificationLevel: "partner",
    estimatedHours: 10,
    difficulty: "medium",
    requiredDocuments: ["CV", "Recommendation letter"],
    faq: [{ question: "Who can apply?", answer: "Emerging leaders aged 24–40 working in civil society or business." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["NGO", "Community group", "Startup", "SME"], label: "Civil society or business" },
      { field: "fundingInterests", operator: "has", value: ["leadership", "community", "business"], label: "Leadership or community interest" },
    ],
  },
  {
    slug: "sprep-environmental-leadership-fellowship",
    title: "SPREP Environmental Leadership Fellowship",
    provider: "SPREP",
    category: "fellowship",
    deadline: daysFromNow(130),
    description:
      "A one-year fellowship for Pacific environmental professionals to work alongside SPREP's technical teams in Apia, building regional skills in conservation and environmental governance.",
    officialUrl: "https://www.sprep.org/fellowships",
    fundingAmount: "Stipend + travel",
    verificationLevel: "official",
    estimatedHours: 16,
    difficulty: "hard",
    requiredDocuments: ["CV", "Recommendation letter", "Academic transcript"],
    rules: [
      { field: "sector", operator: "has", value: ["Climate & Environment", "Fisheries", "Research"], label: "Environment sector" },
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "fundingInterests", operator: "has", value: ["climate", "environment", "research"], label: "Environment interest" },
    ],
  },

  // -------------------------------------------------------------- competition
  {
    slug: "tourism-fiji-innovation-challenge",
    title: "Tourism Fiji Innovation Challenge",
    provider: "Tourism Fiji",
    category: "competition",
    deadline: daysFromNow(41),
    description:
      "A national competition for entrepreneurs and students to pitch digital and sustainable solutions that improve Fiji's tourism experience. Winners receive seed funding and a pilot with Tourism Fiji partners.",
    officialUrl: "https://www.fiji.travel/innovation",
    fundingAmount: "FJD 30,000",
    currency: "FJD",
    amountLow: 10000,
    amountHigh: 30000,
    verificationLevel: "official",
    estimatedHours: 9,
    difficulty: "medium",
    requiredDocuments: ["Proposal", "CV"],
    stages: [
      { name: "Submit pitch deck", description: "10-slide deck and short video.", order: 1 },
      { name: "Semi-finals", description: "Virtual pitch to judges.", order: 2 },
      { name: "Finals", description: "Live pitch in Suva.", order: 3 },
    ],
    faq: [
      { question: "Who can enter?", answer: "Individuals, students and startups with a Fiji connection." },
      { question: "What is the prize?", answer: "FJD 10,000–30,000 and a pilot opportunity." },
    ],
    rules: [
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "sector", operator: "has", value: ["Tourism", "ICT / Technology"], label: "Tourism or technology" },
      { field: "organizationType", operator: "in", value: ["Individual", "Startup", "SME"], label: "Individual, startup or SME" },
    ],
  },
  {
    slug: "waste4good-fiji-pitch",
    title: "Waste4Good Fiji Pitch",
    provider: "Fiji Commerce & Employers Federation",
    category: "competition",
    deadline: daysFromNow(22),
    description:
      "A pitch competition for waste reduction and recycling ventures in Fiji. Winners get seed funding, collection contracts and access to recyclers.",
    officialUrl: "https://fcef.com.fj/waste4good",
    fundingAmount: "FJD 15,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 15000,
    verificationLevel: "official",
    estimatedHours: 6,
    difficulty: "easy",
    requiredDocuments: ["Proposal", "Business registration"],
    faq: [{ question: "Who can enter?", answer: "Ventures and community projects working on waste in Fiji." }],
    rules: [
      { field: "sector", operator: "has", value: ["Waste Management", "Climate & Environment"], label: "Waste or environment sector" },
      { field: "fundingInterests", operator: "has", value: ["innovation", "business", "environment"], label: "Innovation or environment interest" },
    ],
  },
  {
    slug: "pacific-coders-challenge",
    title: "Pacific Coders Challenge",
    provider: "Pacific Islands Forum Secretariat",
    category: "competition",
    deadline: daysFromNow(26),
    description:
      "A regional coding and hackathon competition for Pacific students and developers, with prize funding for the strongest digital solutions to local problems.",
    officialUrl: "https://www.forumsec.org/pacific-coders",
    fundingAmount: "USD 8,000",
    currency: "USD",
    amountLow: 2000,
    amountHigh: 8000,
    verificationLevel: "partner",
    estimatedHours: 10,
    difficulty: "medium",
    requiredDocuments: ["CV", "Academic transcript"],
    faq: [{ question: "Who can enter?", answer: "Individuals and teams based in the Pacific." }],
    rules: [
      { field: "sector", operator: "has", value: ["ICT / Technology"], label: "Technology sector" },
      { field: "fundingInterests", operator: "has", value: ["innovation", "startup", "job"], label: "Innovation or tech interest" },
    ],
  },
  {
    slug: "wib-fiji-women-in-business-pitch",
    title: "Women in Business Pitch Night",
    provider: "Fiji Women in Business Association",
    category: "competition",
    deadline: daysFromNow(35),
    description:
      "A pitch night for women-led ventures in Fiji. Winners receive prize funding plus a year of mentoring and networking through FWiB's membership.",
    officialUrl: "https://www.fwib.org.fj/pitch",
    fundingAmount: "FJD 10,000",
    currency: "FJD",
    amountLow: 3000,
    amountHigh: 10000,
    verificationLevel: "official",
    estimatedHours: 7,
    difficulty: "easy",
    requiredDocuments: ["Proposal", "CV", "Business registration"],
    stages: [
      { name: "Apply", description: "Short form and pitch video.", order: 1 },
      { name: "Pitch night", description: "Live 3-minute pitch in Suva.", order: 2 },
    ],
    faq: [{ question: "Who can apply?", answer: "Women-led ventures at any stage, from idea to established." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["Individual", "Startup", "SME"], label: "Individual, startup or SME" },
      { field: "fundingInterests", operator: "has", value: ["startup", "business"], label: "Business or startup interest" },
    ],
  },

  // --------------------------------------------------------- business support
  {
    slug: "fdb-small-business-growth-loan",
    title: "FDB Small Business Growth Loan",
    provider: "Fiji Development Bank",
    category: "business-support",
    isRolling: true,
    description:
      "Affordable working capital and asset finance for small Fijian businesses through the Fiji Development Bank, with flexible terms and a streamlined application.",
    officialUrl: "https://www.fdb.com.fj/growth-loan",
    fundingAmount: "Up to FJD 100,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 100000,
    verificationLevel: "official",
    estimatedHours: 6,
    difficulty: "easy",
    requiredDocuments: ["Business registration", "Tax certificate (TIN)", "Bank statement", "Business plan"],
    faq: [
      { question: "Who can apply?", answer: "Registered small businesses trading in Fiji." },
      { question: "Is collateral required?", answer: "Terms depend on loan size and business history." },
    ],
    rules: [
      { field: "organizationType", operator: "in", value: ["Startup", "SME"], label: "Startup or SME" },
      { field: "documentsAvailable", operator: "hasAll", value: ["business-registration", "tax-certificate"], label: "Registration and TIN on hand" },
      { field: "fundingInterests", operator: "has", value: ["business", "startup"], label: "Business interest" },
    ],
  },
  {
    slug: "bizhub-fiji-accelerator",
    title: "BizHub Fiji Accelerator",
    provider: "Fiji Commerce & Employers Federation",
    category: "business-support",
    deadline: daysFromNow(68),
    description:
      "A twelve-week accelerator for early-stage Fijian ventures, offering co-working space, workshops, mentorship and demo-day access to investors.",
    officialUrl: "https://fcef.com.fj/bizhub",
    fundingAmount: "Programme + up to FJD 20,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 20000,
    verificationLevel: "official",
    estimatedHours: 14,
    difficulty: "medium",
    requiredDocuments: ["Business registration", "Proposal", "CV"],
    stages: [
      { name: "Apply", description: "Startup profile and traction numbers.", order: 1 },
      { name: "Cohort interview", description: "Meet the accelerator team.", order: 2 },
      { name: "Programme", description: "12 weeks of structured support.", order: 3 },
    ],
    faq: [{ question: "Who can apply?", answer: "Registered Fijian ventures with a working product or service." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["Startup", "SME"], label: "Startup or SME" },
      { field: "businessStage", operator: "in", value: ["Idea", "Early stage", "Growth"], label: "Early-stage venture" },
      { field: "fundingInterests", operator: "has", value: ["startup", "business", "innovation"], label: "Startup or business interest" },
    ],
  },
  {
    slug: "sme-mentorship-programme",
    title: "SME Mentorship Programme",
    provider: "Fiji Civil Service",
    category: "business-support",
    isRolling: true,
    description:
      "A government-backed mentorship matching established Fijian business owners with growing SMEs. Six months of monthly mentoring sessions on finance, operations and market access.",
    officialUrl: "https://www.ftib.gov.fj/sme-mentorship",
    fundingAmount: "Free programme",
    verificationLevel: "official",
    estimatedHours: 3,
    difficulty: "easy",
    requiredDocuments: ["Business registration", "CV"],
    faq: [{ question: "Who can apply?", answer: "SME owners in Fiji who have been trading for at least a year." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["SME", "Startup"], label: "SME or startup" },
      { field: "fundingInterests", operator: "has", value: ["business", "training"], label: "Business or training interest" },
    ],
  },
  {
    slug: "pti-market-access-programme",
    title: "Pacific Trade Invest Market Access",
    provider: "Pacific Trade Invest",
    category: "business-support",
    deadline: daysFromNow(96),
    description:
      "Support for Fijian exporters entering Australian and New Zealand markets, including trade missions, compliance advice and matchmaking with buyers.",
    officialUrl: "https://www.pacifictradeinvest.com/fiji",
    fundingAmount: "Subsidised participation",
    verificationLevel: "official",
    estimatedHours: 8,
    difficulty: "medium",
    requiredDocuments: ["Business registration", "Proposal", "Tax certificate (TIN)"],
    faq: [{ question: "Who can apply?", answer: "Fijian businesses ready to export to Australia or New Zealand." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["SME", "Startup"], label: "SME or startup" },
      { field: "businessStage", operator: "in", value: ["Early stage", "Growth", "Established"], label: "Operating business" },
    ],
  },

  // ---------------------------------------------------------- community grants
  {
    slug: "fiji-womens-fund-community-grant",
    title: "Fiji Women's Fund Community Grant",
    provider: "Fiji Women's Fund",
    category: "community-grant",
    deadline: daysFromNow(29),
    description:
      "Grants for women-led and women-focused community groups across Fiji. Supports income-generating activities, livelihood projects and community wellbeing initiatives.",
    officialUrl: "https://www.fijiwomensfund.org",
    fundingAmount: "FJD 20,000",
    currency: "FJD",
    amountLow: 5000,
    amountHigh: 20000,
    verificationLevel: "official",
    estimatedHours: 8,
    difficulty: "easy",
    requiredDocuments: ["Proposal", "Budget template", "Bank statement"],
    stages: [
      { name: "Letter of interest", description: "One-page letter describing your group and project.", order: 1 },
      { name: "Full proposal", description: "Detailed proposal and budget.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Women-led and women-focused community groups and NGOs in Fiji." },
      { question: "What can funding be used for?", answer: "Livelihoods, income-generating activities, and community projects." },
    ],
    rules: [
      { field: "organizationType", operator: "in", value: ["NGO", "Community group"], label: "NGO or community group" },
      { field: "sector", operator: "has", value: ["Community Development", "Agriculture", "Education"], label: "Community-focused sector" },
      { field: "documentsAvailable", operator: "hasAll", value: ["bank-statement"], label: "Bank account statement" },
    ],
  },
  {
    slug: "national-youth-innovation-grant",
    title: "National Youth Innovation Grant",
    provider: "Fiji Ministry of Youth and Sports",
    category: "community-grant",
    isRolling: true,
    description:
      "A rolling grant supporting young Fijians aged 16–35 to launch small community and social enterprises. Applications are reviewed monthly.",
    officialUrl: "https://www.youth.gov.fj/innovation-grant",
    fundingAmount: "FJD 10,000",
    currency: "FJD",
    amountLow: 3000,
    amountHigh: 10000,
    verificationLevel: "official",
    estimatedHours: 6,
    difficulty: "easy",
    ageMin: 16,
    ageMax: 35,
    requiredDocuments: ["National ID", "Proposal"],
    stages: [
      { name: "Online application", description: "Project idea and basic budget.", order: 1 },
      { name: "District review", description: "Youth officer review and support.", order: 2 },
    ],
    faq: [
      { question: "Who can apply?", answer: "Fijian citizens aged 16–35." },
      { question: "When can I apply?", answer: "Applications are accepted all year and reviewed monthly." },
    ],
    rules: [
      { field: "age", operator: "gte", value: 16, label: "16 years or older" },
      { field: "age", operator: "lte", value: 35, label: "35 years or younger" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "documentsAvailable", operator: "hasAll", value: ["id"], label: "National ID on hand" },
    ],
  },
  {
    slug: "waste-warriors-community-fund",
    title: "Waste Warriors Community Fund",
    provider: "FCOSS",
    category: "community-grant",
    deadline: daysFromNow(33),
    description:
      "Micro-grants for community groups running waste-management and recycling projects in urban and peri-urban Fiji, including school-based recycling schemes.",
    officialUrl: "https://www.fcoss.org.fj/waste-warriors",
    fundingAmount: "FJD 8,000",
    currency: "FJD",
    amountLow: 2000,
    amountHigh: 8000,
    verificationLevel: "partner",
    estimatedHours: 6,
    difficulty: "easy",
    requiredDocuments: ["Proposal", "Budget template"],
    faq: [{ question: "Who can apply?", answer: "Community groups, schools and village committees." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["NGO", "Community group"], label: "NGO or community group" },
      { field: "sector", operator: "has", value: ["Waste Management", "Climate & Environment"], label: "Waste or climate sector" },
    ],
  },
  {
    slug: "fcoss-community-development-micro-grant",
    title: "FCOSS Community Development Micro-Grant",
    provider: "FCOSS",
    category: "community-grant",
    isRolling: true,
    description:
      "Small micro-grants for community development projects led by local organisations in rural Fiji, from village infrastructure to income-generating cooperatives.",
    officialUrl: "https://www.fcoss.org.fj/micro-grants",
    fundingAmount: "FJD 4,000",
    currency: "FJD",
    amountLow: 1000,
    amountHigh: 4000,
    verificationLevel: "partner",
    estimatedHours: 4,
    difficulty: "easy",
    requiredDocuments: ["Proposal", "Bank statement"],
    rules: [
      { field: "organizationType", operator: "in", value: ["Community group", "NGO"], label: "Community group or NGO" },
      { field: "sector", operator: "has", value: ["Community Development"], label: "Community development sector" },
    ],
  },
  {
    slug: "save-the-children-village-grant",
    title: "Pacific Water for Life Fund",
    provider: "International Labour Organization",
    category: "community-grant",
    deadline: daysFromNow(54),
    description:
      "Grants for villages and settlements improving drinking water, sanitation and hygiene, delivered through local labour and community management.",
    officialUrl: "https://www.ilo.org/pacific/water",
    fundingAmount: "FJD 12,000",
    currency: "FJD",
    amountLow: 4000,
    amountHigh: 12000,
    verificationLevel: "partner",
    estimatedHours: 8,
    difficulty: "medium",
    requiredDocuments: ["Proposal", "Budget template"],
    faq: [{ question: "Who can apply?", answer: "Village and settlement committees with community support." }],
    rules: [
      { field: "organizationType", operator: "in", value: ["Community group"], label: "Community group" },
      { field: "sector", operator: "has", value: ["Water & Sanitation"], label: "Water and sanitation sector" },
    ],
  },

  // --------------------------------------------------------------------- jobs
  {
    slug: "pacific-development-graduate-officer",
    title: "Pacific Development Graduate Officer",
    provider: "Fiji Civil Service",
    category: "job",
    isRolling: true,
    description:
      "A graduate development program rotating through government ministries in Suva, aimed at recent graduates passionate about Pacific development and public service.",
    officialUrl: "https://www.civilservice.gov.fj/graduate-program",
    fundingAmount: "Salary",
    verificationLevel: "official",
    estimatedHours: 5,
    difficulty: "easy",
    ageMax: 40,
    requiredDocuments: ["CV", "Academic transcript", "Recommendation letter"],
    stages: [{ name: "Apply online", description: "Submit application and documents.", order: 1 }],
    faq: [
      { question: "Who can apply?", answer: "Fijian citizens with a completed tertiary qualification." },
      { question: "How long is the program?", answer: "12 months with potential for permanency." },
    ],
    rules: [
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
    ],
  },
  {
    slug: "spc-young-professionals-scheme",
    title: "SPC Young Professionals Scheme",
    provider: "Pacific Community (SPC)",
    category: "job",
    deadline: daysFromNow(77),
    description:
      "Paid placements for recent Pacific graduates across SPC's technical divisions, from fisheries to public health, based in Suva, Noumea and Apia.",
    officialUrl: "https://www.spc.int/young-professionals",
    fundingAmount: "Salary",
    verificationLevel: "official",
    estimatedHours: 6,
    difficulty: "medium",
    requiredDocuments: ["CV", "Academic transcript", "Recommendation letter", "Passport"],
    stages: [
      { name: "Application", description: "Cover letter and documents.", order: 1 },
      { name: "Assessment", description: "Written task and interview.", order: 2 },
    ],
    faq: [{ question: "Who can apply?", answer: "Graduates from Pacific island countries with a bachelor's degree." }],
    rules: [
      { field: "education", operator: "gte", value: "Bachelor's", label: "Bachelor's degree or higher" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "employmentStatus", operator: "in", value: ["Student", "Unemployed", "Employed"], label: "Early-career applicant" },
    ],
  },

  // -------------------------------------------------- professional development
  {
    slug: "professional-development-fund",
    title: "Professional Development Fund",
    provider: "Fiji Ministry of Youth and Sports",
    category: "professional-development",
    isRolling: true,
    description:
      "Co-funding for Fijian professionals and students to attend courses, conferences, and certification programs that build job-ready skills.",
    officialUrl: "https://www.youth.gov.fj/professional-development",
    fundingAmount: "FJD 5,000",
    currency: "FJD",
    amountLow: 1000,
    amountHigh: 5000,
    verificationLevel: "official",
    estimatedHours: 4,
    difficulty: "easy",
    ageMin: 18,
    requiredDocuments: ["CV", "National ID"],
    stages: [{ name: "Apply online", description: "Course details and quote.", order: 1 }],
    faq: [
      { question: "Who can apply?", answer: "Fijian citizens aged 18+ seeking professional development." },
      { question: "What is covered?", answer: "Up to FJD 5,000 toward course fees." },
    ],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "documentsAvailable", operator: "hasAll", value: ["id"], label: "National ID on hand" },
    ],
  },
  {
    slug: "youth-skills-training-bursary",
    title: "Youth Skills Training Bursary",
    provider: "Fiji Ministry of Youth and Sports",
    category: "professional-development",
    deadline: daysFromNow(21),
    description:
      "Bursaries supporting unemployed young Fijians to complete accredited vocational training courses at approved institutions across the country.",
    officialUrl: "https://www.youth.gov.fj/bursary",
    fundingAmount: "FJD 3,000",
    currency: "FJD",
    amountLow: 1000,
    amountHigh: 3000,
    verificationLevel: "official",
    estimatedHours: 3,
    difficulty: "easy",
    ageMin: 16,
    requiredDocuments: ["National ID", "CV"],
    faq: [{ question: "Who can apply?", answer: "Unemployed Fijians aged 16–35." }],
    rules: [
      { field: "age", operator: "gte", value: 16, label: "16 years or older" },
      { field: "citizenship", operator: "eq", value: "Fijian", label: "Fijian citizen" },
      { field: "employmentStatus", operator: "in", value: ["Student", "Unemployed"], label: "Studying or unemployed" },
    ],
  },
  {
    slug: "wib-leadership-training-grant",
    title: "Women in Leadership Training Grant",
    provider: "Fiji Women in Business Association",
    category: "professional-development",
    deadline: daysFromNow(47),
    description:
      "Grants covering course fees for leadership, management and digital skills training for women in business and community roles across Fiji.",
    officialUrl: "https://www.fwib.org.fj/training",
    fundingAmount: "FJD 2,500",
    currency: "FJD",
    amountLow: 500,
    amountHigh: 2500,
    verificationLevel: "official",
    estimatedHours: 3,
    difficulty: "easy",
    requiredDocuments: ["CV", "National ID"],
    faq: [{ question: "Who can apply?", answer: "Women in business, employment or community leadership." }],
    rules: [
      { field: "fundingInterests", operator: "has", value: ["training", "leadership", "business"], label: "Training or leadership interest" },
      { field: "documentsAvailable", operator: "hasAll", value: ["id"], label: "National ID on hand" },
    ],
  },
  {
    slug: "digital-skills-bootcamp-scholarship",
    title: "Digital Skills Bootcamp Scholarship",
    provider: "Pacific Trade Invest",
    category: "professional-development",
    deadline: daysFromNow(31),
    description:
      "Scholarships for Fijians to attend online bootcamps in web development, data literacy and digital marketing, run in partnership with regional training providers.",
    officialUrl: "https://www.pacifictradeinvest.com/digital-skills",
    fundingAmount: "Full course fees",
    verificationLevel: "partner",
    estimatedHours: 12,
    difficulty: "medium",
    requiredDocuments: ["CV", "National ID", "Recommendation letter"],
    stages: [
      { name: "Apply", description: "Profile and motivation.", order: 1 },
      { name: "Shortlist", description: "Cohort selection.", order: 2 },
      { name: "Bootcamp", description: "Six weeks of part-time training.", order: 3 },
    ],
    faq: [{ question: "Who can apply?", answer: "Fijians aged 18+ with reliable internet access." }],
    rules: [
      { field: "age", operator: "gte", value: 18, label: "18 years or older" },
      { field: "fundingInterests", operator: "has", value: ["training", "job", "startup"], label: "Skills or career interest" },
    ],
  },
];

async function main() {
  console.log("Seeding Koru database…");

  // Clear existing data in foreign-key safe order.
  await prisma.syncLog.deleteMany();
  await prisma.ingestionSource.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.application.deleteMany();
  await prisma.eligibilityRule.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Ingestion sources the platform will keep pulling from.
  const govSource = await prisma.ingestionSource.create({
    data: {
      name: "Fiji Government Opportunities Portal",
      url: "https://www.fiji.gov.fj/opportunities",
      sourceType: "government",
      description: "Grants, scholarships and public service opportunities published by the Fijian Government.",
      cadence: "weekly",
      adapter: "sample",
      syncStatus: "success",
      lastSyncAt: daysFromNow(-1),
    },
  });
  const uspSource = await prisma.ingestionSource.create({
    data: {
      name: "USP Scholarships & Research",
      url: "https://www.usp.ac.fj/scholarships",
      sourceType: "university",
      description: "Scholarships and research grants from the University of the South Pacific.",
      cadence: "weekly",
      adapter: "sample",
      syncStatus: "success",
      lastSyncAt: new Date(),
    },
  });
  const undpSource = await prisma.ingestionSource.create({
    data: {
      name: "UNDP Pacific Funding",
      url: "https://www.undp.org/pacific/funding",
      sourceType: "international",
      description: "Grants and calls for proposals from UNDP Pacific.",
      cadence: "monthly",
      adapter: "sample",
      syncStatus: "success",
      lastSyncAt: new Date(),
    },
  });
  const spcSource = await prisma.ingestionSource.create({
    data: {
      name: "Pacific Community Programmes",
      url: "https://www.spc.int/opportunities",
      sourceType: "regional",
      description: "Regional programmes, fellowships and grants from SPC.",
      cadence: "weekly",
      adapter: "sample",
      syncStatus: "success",
      lastSyncAt: new Date(),
    },
  });
  const fcossSource = await prisma.ingestionSource.create({
    data: {
      name: "FCOSS Civil Society Funding",
      url: "https://www.fcoss.org.fj/funding",
      sourceType: "ngo",
      description: "Micro-grants and support for community organisations.",
      cadence: "monthly",
      adapter: "sample",
      syncStatus: "success",
      lastSyncAt: new Date(),
    },
  });
  const privateSource = await prisma.ingestionSource.create({
    data: {
      name: "Pacific Private Foundations",
      url: "https://www.pacificfoundations.org/grants",
      sourceType: "private",
      description: "Grants from private and family foundations in the Pacific.",
      cadence: "monthly",
      adapter: "sample",
      syncStatus: "success",
      lastSyncAt: new Date(),
    },
  });

  const providerNames = [
    "Fiji Commerce & Employers Federation",
    "UNDP Pacific Office in Fiji",
    "University of the South Pacific",
    "Australia Awards",
    "Fiji Women's Fund",
    "Pacific Community (SPC)",
    "Tourism Fiji",
    "Fiji Ministry of Youth and Sports",
    "Fiji Civil Service",
    "Manaaki New Zealand Scholarships",
    "Fiji National University",
    "Global Environment Facility SGP",
    "Pacific Islands Forum Secretariat",
    "International Labour Organization",
    "Fiji Development Bank",
    "Commonwealth Scholarship Commission",
    "Japan International Cooperation Agency (JICA)",
    "Ministry of Education (China)",
    "Rotary Peace Center, USP",
    "The Asia Foundation",
    "SPREP",
    "Fiji Women in Business Association",
    "Pacific Trade Invest",
    "FCOSS",
    "Acacia Foundation",
    "Bakani Family Foundation",
    "Fiji Arts Council",
  ];
  const providers = new Map<string, string>();
  for (const name of providerNames) {
    const p = await prisma.provider.create({
      data: {
        organization: name,
        country: "Fiji",
        verified: true,
        website: `https://example-${name.toLowerCase().replace(/[^a-z]+/g, "")}.org`,
      },
    });
    providers.set(name, p.id);
  }
  // Tie providers to their ingestion sources.
  const tie = async (name: string, sourceId: string) =>
    prisma.provider.update({ where: { id: providers.get(name)! }, data: { ingestionSourceId: sourceId } });
  await tie("Fiji Ministry of Youth and Sports", govSource.id);
  await tie("Fiji Civil Service", govSource.id);
  await tie("University of the South Pacific", uspSource.id);
  await tie("Fiji National University", uspSource.id);
  await tie("UNDP Pacific Office in Fiji", undpSource.id);
  await tie("Pacific Community (SPC)", spcSource.id);
  await tie("Pacific Islands Forum Secretariat", spcSource.id);
  await tie("SPREP", spcSource.id);
  await tie("FCOSS", fcossSource.id);
  await tie("Bakani Family Foundation", privateSource.id);
  await tie("Acacia Foundation", privateSource.id);

  // Opportunities.
  let oppCount = 0;
  for (const seed of OPPORTUNITIES) {
    const providerId = providers.get(seed.provider);
    if (!providerId) throw new Error(`Missing provider: ${seed.provider}`);
    const opp = await prisma.opportunity.create({
      data: {
        slug: seed.slug,
        title: seed.title,
        providerId,
        category: seed.category,
        deadline: seed.deadline,
        isRolling: seed.isRolling ?? false,
        description: seed.description,
        officialUrl: seed.officialUrl,
        applicationUrl: seed.applicationUrl,
        fundingAmount: seed.fundingAmount,
        currency: seed.currency ?? "FJD",
        amountLow: seed.amountLow,
        amountHigh: seed.amountHigh,
        status: "published",
        verificationLevel: seed.verificationLevel,
        estimatedHours: seed.estimatedHours,
        difficulty: seed.difficulty,
        ageMin: seed.ageMin,
        ageMax: seed.ageMax,
        requiredDocuments: JSON.stringify(seed.requiredDocuments),
        stages: JSON.stringify(seed.stages ?? []),
        faq: JSON.stringify(seed.faq ?? []),
        sourceUrl: seed.officialUrl,
        lastVerifiedAt: daysFromNow(-5),
      },
    });
    for (const rule of seed.rules ?? []) {
      await prisma.eligibilityRule.create({
        data: {
          opportunityId: opp.id,
          field: rule.field,
          operator: rule.operator,
          value: JSON.stringify(rule.value),
          required: rule.required ?? true,
          label: rule.label,
        },
      });
    }
    oppCount++;
  }
  console.log(`  ${oppCount} opportunities`);

  // Demo user with a rich, fully onboarded profile.
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@koru.fj",
      name: "Sereana Tui",
      onboardedAt: new Date(),
    },
  });
  await prisma.profile.create({
    data: {
      userId: demoUser.id,
      age: 27,
      citizenship: "Fijian",
      city: "Suva",
      education: "Bachelor's",
      employmentStatus: "Self-employed",
      sector: "Agriculture",
      organizationType: "Startup",
      businessStage: "Early stage",
      yearsExperience: 4,
      fundingInterests: JSON.stringify(["startup", "climate", "community", "research"]),
      languages: JSON.stringify(["Fijian", "English", "Hindi"]),
      documentsAvailable: JSON.stringify([
        "cv",
        "passport",
        "transcript",
        "business-registration",
        "tax-certificate",
        "bank-statement",
        "id",
      ]),
      bio: "Founder of a small agritech venture in Suva connecting farmers to markets.",
    },
  });

  // Demo applications — a realistic multi-application pipeline.
  const oppBySlug = async (slug: string) => prisma.opportunity.findUniqueOrThrow({ where: { slug } });
  const startupOpp = await oppBySlug("fiji-startup-challenge-2026");
  const awardsOpp = await oppBySlug("australia-awards-fiji-scholarship");
  const agriOpp = await oppBySlug("agripacific-innovation-challenge");
  const gefOpp = await oppBySlug("gef-sgp-fiji-community-climate-grants");
  const wibOpp = await oppBySlug("wib-fiji-women-in-business-pitch");

  const mkTasks = async (
    appId: string,
    templates: { title: string; category: string; done: boolean; dueIn?: number; priority?: string }[],
  ) => {
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      await prisma.task.create({
        data: {
          applicationId: appId,
          title: t.title,
          category: t.category,
          completed: t.done,
          completedAt: t.done ? daysFromNow(-5 - i) : null,
          dueDate: t.dueIn !== undefined ? daysFromNow(t.dueIn) : null,
          priority: t.priority ?? "medium",
          sortOrder: i,
        },
      });
    }
  };

  const app1 = await prisma.application.create({
    data: { userId: demoUser.id, opportunityId: startupOpp.id, status: "in-progress", completion: 55, notes: "Need to finish the pitch deck and get a second reviewer on the budget.", startedAt: daysFromNow(-12) },
  });
  await mkTasks(app1.id, [
    { title: "Complete stage: Online application", category: "other", done: true },
    { title: "Upload: Business registration", category: "document", done: true },
    { title: "Upload: Tax certificate (TIN)", category: "document", done: true },
    { title: "Upload: CV", category: "document", done: true },
    { title: "Upload: Proposal", category: "document", done: false, dueIn: 6 },
    { title: "Prepare a budget", category: "budget", done: false, dueIn: 4 },
    { title: "Draft your proposal", category: "proposal", done: false, dueIn: 9 },
    { title: "Review application portal", category: "logistics", done: false, dueIn: 12 },
    { title: "Final review before submitting", category: "logistics", done: false, dueIn: 16 },
  ]);

  const app2 = await prisma.application.create({
    data: { userId: demoUser.id, opportunityId: awardsOpp.id, status: "not-started", completion: 0 },
  });
  await mkTasks(app2.id, [
    { title: "Complete stage: Online application", category: "other", done: false },
    { title: "Upload: Passport", category: "document", done: false },
    { title: "Upload: Academic transcript", category: "document", done: false },
    { title: "Upload: CV", category: "document", done: false },
    { title: "Upload: Recommendation letter", category: "document", done: false },
    { title: "Write a study plan", category: "proposal", done: false },
    { title: "Final review before submitting", category: "logistics", done: false },
  ]);

  const app3 = await prisma.application.create({
    data: { userId: demoUser.id, opportunityId: agriOpp.id, status: "ready-to-submit", completion: 85, startedAt: daysFromNow(-20) },
  });
  await mkTasks(app3.id, [
    { title: "Submit solution entry", category: "other", done: true },
    { title: "Upload: Proposal", category: "document", done: true },
    { title: "Upload: CV", category: "document", done: true },
    { title: "Film the one-minute video", category: "logistics", done: true },
    { title: "Final proofread", category: "logistics", done: false, dueIn: 2 },
  ]);

  const app4 = await prisma.application.create({
    data: { userId: demoUser.id, opportunityId: gefOpp.id, status: "in-progress", completion: 30, startedAt: daysFromNow(-8) },
  });
  await mkTasks(app4.id, [
    { title: "Complete stage: Project outline", category: "other", done: true },
    { title: "Upload: Proposal", category: "document", done: false, dueIn: 10 },
    { title: "Upload: Budget template", category: "budget", done: false, dueIn: 10 },
    { title: "Upload: Bank statement", category: "document", done: true },
    { title: "Get community letter of support", category: "logistics", done: false, dueIn: 7 },
  ]);

  const app5 = await prisma.application.create({
    data: { userId: demoUser.id, opportunityId: wibOpp.id, status: "in-progress", completion: 15, startedAt: daysFromNow(-3) },
  });
  await mkTasks(app5.id, [
    { title: "Apply with pitch video", category: "other", done: false, dueIn: 5 },
    { title: "Upload: Proposal", category: "document", done: false, dueIn: 5 },
    { title: "Upload: CV", category: "document", done: true },
    { title: "Rehearse 3-minute pitch", category: "logistics", done: false, dueIn: 8 },
  ]);

  // Demo documents.
  await prisma.document.createMany({
    data: [
      { userId: demoUser.id, applicationId: app1.id, name: "Business registration certificate", type: "business-registration", isReusable: true, verified: true },
      { userId: demoUser.id, applicationId: app1.id, name: "Sereana_Tui_CV.pdf", type: "cv", isReusable: true },
      { userId: demoUser.id, applicationId: app1.id, name: "Bank statement — BSP", type: "bank-statement", isReusable: false },
      { userId: demoUser.id, applicationId: app2.id, name: "Sereana_Tui_Passport.pdf", type: "passport", isReusable: true, verified: true },
      { userId: demoUser.id, applicationId: app2.id, name: "USP transcript 2024.pdf", type: "transcript", isReusable: true },
      { userId: demoUser.id, applicationId: app4.id, name: "TIN certificate.pdf", type: "tax-certificate", isReusable: true, verified: true },
      { userId: demoUser.id, name: "Sereana_Tui_CV.pdf", type: "cv", isReusable: true, verified: true },
      { userId: demoUser.id, name: "Sereana_Tui_Passport.pdf", type: "passport", isReusable: true, verified: true },
      { userId: demoUser.id, name: "USP transcript 2024.pdf", type: "transcript", isReusable: true },
      { userId: demoUser.id, name: "TIN certificate.pdf", type: "tax-certificate", isReusable: true, verified: true },
    ],
  });

  // Reminders + notifications for the demo user.
  await prisma.reminder.createMany({
    data: [
      { userId: demoUser.id, applicationId: app1.id, title: "Fiji Startup Challenge deadline in 7 days", date: daysFromNow(55), type: "deadline" },
      { userId: demoUser.id, applicationId: app1.id, title: "Upload proposal", date: daysFromNow(6), type: "task" },
      { userId: demoUser.id, applicationId: app1.id, title: "Prepare budget", date: daysFromNow(4), type: "task" },
      { userId: demoUser.id, applicationId: app3.id, title: "AgriPacific entry due", date: daysFromNow(2), type: "deadline" },
    ],
  });
  await prisma.notification.createMany({
    data: [
      { userId: demoUser.id, type: "deadline", title: "AgriPacific Innovation Challenge closes soon", body: "Your entry is ready to submit. Final proofread before the deadline.", link: "/applications" },
      { userId: demoUser.id, type: "deadline", title: "Fiji Startup Challenge closes in 2 months", body: "You still need to upload your proposal and prepare a budget.", link: "/applications" },
      { userId: demoUser.id, type: "application", title: "Australia Awards Fiji is open", body: "You have not started this application yet. Estimated effort: 20 hours.", link: "/opportunities/australia-awards-fiji-scholarship" },
      { userId: demoUser.id, type: "system", title: "3 new opportunities indexed", body: "The feed picked up new grants from SPC and the Forum Secretariat.", link: "/opportunities" },
    ],
  });

  console.log(`  Demo user: demo@koru.fj`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
