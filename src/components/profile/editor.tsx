"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FIJI_CITIES,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  ORGANIZATION_TYPES,
  BUSINESS_STAGES,
  SECTORS,
  DOCUMENT_TYPES,
} from "@/lib/constants";
import { updateProfile, updateProfileName } from "@/server/actions/profile";

interface ProfileData {
  age: number | null;
  citizenship: string | null;
  city: string | null;
  education: string | null;
  employmentStatus: string | null;
  sector: string | null;
  organizationType: string | null;
  businessStage: string | null;
  yearsExperience: number | null;
  fundingInterests: string[];
  languages: string[];
  documentsAvailable: string[];
  bio: string | null;
}

const INTEREST_OPTIONS = [
  "startup",
  "business",
  "climate",
  "environment",
  "research",
  "travel",
  "scholarship",
  "study",
  "leadership",
  "community",
  "training",
  "job",
  "innovation",
];

function ChipSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  const [show, setShow] = useState(false);
  const shown = selected.length > 0 ? selected : [];
  const remaining = options.filter((o) => !selected.includes(o.value));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((v) => {
          const opt = options.find((o) => o.value === v);
          return (
            <Badge key={v} variant="outline" className="gap-1 pr-1 font-normal">
              {opt?.label ?? v}
              <button type="button" onClick={() => toggle(v)} aria-label={`Remove ${v}`} className="hover:text-destructive">
                ×
              </button>
            </Badge>
          );
        })}
      </div>
      {!show ? (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          + {placeholder}
        </button>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className="border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {o.label}
            </button>
          ))}
          <button type="button" onClick={() => setShow(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export function ProfileEditor({
  name,
  email,
  profile,
}: {
  name: string;
  email: string;
  profile: ProfileData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name,
    age: profile.age?.toString() ?? "",
    citizenship: profile.citizenship ?? "",
    city: profile.city ?? "",
    education: profile.education ?? "",
    employmentStatus: profile.employmentStatus ?? "",
    sector: profile.sector ?? "",
    organizationType: profile.organizationType ?? "",
    businessStage: profile.businessStage ?? "",
    yearsExperience: profile.yearsExperience?.toString() ?? "",
    bio: profile.bio ?? "",
    fundingInterests: profile.fundingInterests,
    languages: profile.languages,
    documentsAvailable: profile.documentsAvailable,
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setList = (key: "fundingInterests" | "languages" | "documentsAvailable", value: string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function save() {
    startTransition(async () => {
      try {
        if (form.name.trim() !== name) await updateProfileName(form.name);
        await updateProfile({
          age: form.age ? Number(form.age) : null,
          citizenship: form.citizenship || undefined,
          city: form.city || undefined,
          education: form.education || undefined,
          employmentStatus: form.employmentStatus || undefined,
          sector: form.sector || undefined,
          organizationType: form.organizationType || undefined,
          businessStage: form.businessStage || undefined,
          yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
          fundingInterests: form.fundingInterests,
          languages: form.languages,
          documentsAvailable: form.documentsAvailable,
          bio: form.bio || undefined,
        });
        toast.success("Profile saved");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save profile.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className="border-b pb-4">
        <p className="label-mono text-muted-foreground">You</p>
        <h1 className="mt-1 font-display text-3xl font-light tracking-tight">My profile</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Koru matches you to funding using this profile. Complete it for better matches.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min={13} max={100} value={form.age} onChange={(e) => set("age", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="citizenship">Citizenship</Label>
              <Input id="citizenship" value={form.citizenship} onChange={(e) => set("citizenship", e.target.value)} className="mt-1.5" placeholder="Fijian" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City / town</Label>
              <Select value={form.city} onValueChange={(v) => set("city", v)}>
                <SelectTrigger id="city" className="mt-1.5">
                  <SelectValue placeholder="Select your city" />
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="employment">Employment status</Label>
              <Select value={form.employmentStatus} onValueChange={(v) => set("employmentStatus", v)}>
                <SelectTrigger id="employment" className="mt-1.5">
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
              <Label htmlFor="sector">Sector</Label>
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
          </div>
          <div>
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input id="yearsExperience" type="number" min={0} max={60} value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1.5" placeholder="What do you work on?" />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-[18px] w-[18px] text-primary" /> Interests & documents
          </CardTitle>
          <CardDescription>Drives your match score and eligibility checks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Funding interests</Label>
            <div className="mt-2">
              <ChipSelect options={INTEREST_OPTIONS.map((v) => ({ value: v, label: v }))} selected={form.fundingInterests} onChange={(v) => setList("fundingInterests", v)} placeholder="Add an interest" />
            </div>
          </div>
          <div>
            <Label>Languages</Label>
            <div className="mt-2">
              <ChipSelect
                options={[
                  { value: "English", label: "English" },
                  { value: "Fijian", label: "Fijian" },
                  { value: "Hindi", label: "Hindi" },
                  { value: "Rotuman", label: "Rotuman" },
                ]}
                selected={form.languages}
                onChange={(v) => setList("languages", v)}
                placeholder="Add a language"
              />
            </div>
          </div>
          <div>
            <Label>Documents you have ready</Label>
            <div className="mt-2">
              <ChipSelect
                options={DOCUMENT_TYPES.map((d) => ({ value: d.value, label: d.label }))}
                selected={form.documentsAvailable}
                onChange={(v) => setList("documentsAvailable", v)}
                placeholder="Add a document"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={pending}>
          {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Save profile
        </Button>
      </div>
    </div>
  );
}
