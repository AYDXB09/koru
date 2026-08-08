"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeOnboarding } from "@/server/actions/onboarding";
import {
  FIJI_CITIES,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  ORGANIZATION_TYPES,
  BUSINESS_STAGES,
  SECTORS,
  DOCUMENT_TYPES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "01", title: "Who you are" },
  { n: "02", title: "What you're after" },
  { n: "03", title: "What you have" },
] as const;

const INTERESTS: { value: string; label: string }[] = [
  { value: "startup", label: "Starting a business" },
  { value: "business", label: "Growing a business" },
  { value: "climate", label: "Climate & environment" },
  { value: "research", label: "Research" },
  { value: "study", label: "Study / school" },
  { value: "scholarship", label: "Scholarship" },
  { value: "leadership", label: "Leadership" },
  { value: "community", label: "Community projects" },
  { value: "training", label: "Skills & training" },
  { value: "job", label: "Job / career" },
  { value: "innovation", label: "Innovation & tech" },
];

const LANGUAGES = ["English", "Fijian", "Hindi", "Rotuman"];

export function OnboardingWizard({ name }: { name: string }) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(completeOnboarding, { ok: true });

  const [form, setForm] = useState({
    name,
    age: "",
    city: "",
    education: "",
    employmentStatus: "",
    sector: "",
    organizationType: "",
    businessStage: "",
    yearsExperience: "",
    bio: "",
    interests: [] as string[],
    languages: [] as string[],
    documents: [] as string[],
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key: "interests" | "languages" | "documents", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const canContinue =
    step === 0 ? form.name.trim().length > 0 : step === 1 ? form.interests.length > 0 : true;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (step < 2) {
          e.preventDefault();
          if (canContinue) setStep((s) => s + 1);
        }
      }}
      className="w-full max-w-3xl"
    >
      <div className="grid gap-10 md:grid-cols-[200px_1fr]">
        {/* Step rail */}
        <div className="hidden md:block">
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.n} className="flex items-center gap-3">
                <span
                  className={cn(
                    "tabular h-8 w-8 shrink-0 border text-xs leading-8",
                    i < step && "border-primary text-primary",
                    i === step && "border-foreground bg-foreground text-background",
                    i > step && "border-border text-muted-foreground",
                  )}
                >
                  {i < step ? "✓" : s.n}
                </span>
                <div>
                  <p className={cn("text-sm font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
                    {s.title}
                  </p>
                  <p className="label-mono text-[10px] text-muted-foreground/70">step {i + 1} of 3</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Step body */}
        <div>
          <p className="label-mono text-primary">{STEPS[step].n}</p>
          <h1 className="mt-1 font-display text-3xl font-light tracking-tight">{STEPS[step].title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {step === 0 && "Koru reads this to check eligibility. Nothing is shared."}
            {step === 1 && "Pick what you want from funding. This drives your match ranking."}
            {step === 2 && "Tick what you already hold. We pre-fill applications from these."}
          </p>

          {/* Hidden fields for the server action */}
          <input type="hidden" name="name" value={form.name} />
          <input type="hidden" name="age" value={form.age} />
          <input type="hidden" name="city" value={form.city} />
          <input type="hidden" name="education" value={form.education} />
          <input type="hidden" name="employmentStatus" value={form.employmentStatus} />
          <input type="hidden" name="sector" value={form.sector} />
          <input type="hidden" name="organizationType" value={form.organizationType} />
          <input type="hidden" name="businessStage" value={form.businessStage} />
          <input type="hidden" name="yearsExperience" value={form.yearsExperience} />
          <input type="hidden" name="bio" value={form.bio} />
          {form.interests.map((v) => (
            <input key={v} type="hidden" name="interest" value={v} />
          ))}
          {form.languages.map((v) => (
            <input key={v} type="hidden" name="language" value={v} />
          ))}
          {form.documents.map((v) => (
            <input key={v} type="hidden" name="document" value={v} />
          ))}

          <div className="mt-8">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" min={13} max={100} value={form.age} onChange={(e) => set("age", e.target.value)} className="mt-1.5" placeholder="e.g. 24" />
                  </div>
                  <div>
                    <Label htmlFor="city">City / town</Label>
                    <Select value={form.city} onValueChange={(v) => set("city", v)}>
                      <SelectTrigger id="city" className="mt-1.5">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIJI_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="education">Highest education</Label>
                    <Select value={form.education} onValueChange={(v) => set("education", v)}>
                      <SelectTrigger id="education" className="mt-1.5">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="employmentStatus">Employment status</Label>
                    <Select value={form.employmentStatus} onValueChange={(v) => set("employmentStatus", v)}>
                      <SelectTrigger id="employmentStatus" className="mt-1.5">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="label-mono mb-2 text-muted-foreground">Select all that apply</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {INTERESTS.map((i) => (
                      <button
                        key={i.value}
                        type="button"
                        onClick={() => toggle("interests", i.value)}
                        aria-pressed={form.interests.includes(i.value)}
                        className={cn(
                          "flex items-center justify-between gap-2 border px-3 py-2.5 text-left text-sm transition-colors",
                          form.interests.includes(i.value)
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        )}
                      >
                        {i.label}
                        <span className="label-mono text-[10px] text-primary">{form.interests.includes(i.value) ? "✓" : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="sector">Sector you work in</Label>
                    <Select value={form.sector} onValueChange={(v) => set("sector", v)}>
                      <SelectTrigger id="sector" className="mt-1.5">
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="organizationType">Organization type</Label>
                    <Select value={form.organizationType} onValueChange={(v) => set("organizationType", v)}>
                      <SelectTrigger id="organizationType" className="mt-1.5">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="businessStage">Business stage</Label>
                    <Select value={form.businessStage} onValueChange={(v) => set("businessStage", v)}>
                      <SelectTrigger id="businessStage" className="mt-1.5">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yearsExperience">Years of experience</Label>
                    <Input id="yearsExperience" type="number" min={0} max={60} value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} className="mt-1.5" placeholder="e.g. 3" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="label-mono mb-2 text-muted-foreground">Documents you already hold</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DOCUMENT_TYPES.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggle("documents", d.value)}
                        aria-pressed={form.documents.includes(d.value)}
                        className={cn(
                          "flex items-center justify-between gap-2 border px-3 py-2.5 text-left text-sm transition-colors",
                          form.documents.includes(d.value)
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        )}
                      >
                        {d.label}
                        <span className="label-mono text-[10px] text-primary">{form.documents.includes(d.value) ? "✓" : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Languages</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggle("languages", l)}
                        aria-pressed={form.languages.includes(l)}
                        className={cn(
                          "border px-3 py-1.5 text-xs transition-colors",
                          form.languages.includes(l)
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">One line about you (optional)</Label>
                  <Textarea id="bio" rows={2} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1.5" placeholder="Founder, student, researcher..." />
                </div>
              </div>
            )}
          </div>

          {state.message && !state.ok && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-5">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
            ) : (
              <span className="label-mono text-muted-foreground">No passwords, no codes</span>
            )}

            {step < 2 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-1.5 h-4 w-4 rotate-180" />}
                {pending ? "Building your plan" : "Build my plan"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
