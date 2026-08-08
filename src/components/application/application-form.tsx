"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, FileText, Loader2, PenLine, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RichText } from "@/components/application/rich-text";
import { buildCopyText, formProgress, FORM_FIELDS } from "@/lib/smartfill";
import type { ProfileFacts } from "@/lib/smartfill";
import {
  saveApplicationForm,
  getApplicationForm,
  draftApplicationForm,
} from "@/server/actions/applications";
import type { ApplicationFormData } from "@/server/actions/applications";

const FIELD_LABELS: Record<string, string> = {
  personalStatement: "One line about you",
  proposal: "Proposal",
};

interface ApplicationFormTabProps {
  applicationId: string;
  requiredDocuments: string[];
  applicationUrl: string | null;
  profile: ProfileFacts | null;
  onGoToDocuments: () => void;
}

export function ApplicationFormTab({
  applicationId,
  requiredDocuments,
  applicationUrl,
  profile: initialProfile,
  onGoToDocuments,
}: ApplicationFormTabProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<ProfileFacts | null>(initialProfile);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getApplicationForm(applicationId)
      .then((data: ApplicationFormData) => {
        if (cancelled) return;
        setAnswers(data.answers ?? {});
        if (data.profile) setProfile(data.profile);
      })
      .catch(() => {
        // The server page already passed the grounded profile and documents.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const progress = formProgress(answers);
  const filledSections = FORM_FIELDS.filter(
    (field) => (answers[field] ?? "").trim().length > 0,
  );

  const setAnswer = (field: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [field]: value }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await saveApplicationForm(applicationId, answers);
      if (res.ok) {
        toast.success("Answers saved");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not save.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDraft() {
    setDrafting(true);
    try {
      const res = await draftApplicationForm(applicationId, "proposal");
      if (res.ok) {
        setAnswer("proposal", res.text ?? "");
        toast.success("Draft added. Review and edit it before saving.");
      } else {
        toast.error(res.error ?? "Could not draft.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not draft.");
    } finally {
      setDrafting(false);
    }
  }

  async function handleCopy() {
    const text = buildCopyText(answers);
    if (!text.trim()) {
      toast.error("Nothing to copy yet. Fill in the sections above and save.");
      return;
    }
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) toast.success("Answers copied");
    else toast.error("Could not copy.");
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <p className="font-display text-xl font-light tracking-tight">Walk through, we pre-fill the rest.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&rsquo;re <span className="font-medium text-foreground">{progress}% done</span>. Fill in the
            answers, save, then copy them into the official portal.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !loaded}>
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Save
        </Button>
      </div>
      <div className="h-1.5 bg-muted">
        <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>

      {/* About you */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">About you</CardTitle>
          <CardDescription>Auto-filled from your profile. Change them on your profile page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {profile ? (
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <FactRow label="Full name" value={profile.name ?? null} />
              <FactRow label="Age" value={profile.age != null ? String(profile.age) : null} />
              <FactRow label="City / town" value={profile.city ?? null} />
              <FactRow label="Education" value={profile.education ?? null} />
              <FactRow label="Employment status" value={profile.employmentStatus ?? null} />
              <FactRow label="Sector" value={profile.sector ?? null} />
              <FactRow label="Languages" value={joinFacts(profile.languages)} />
              <FactRow label="Funding interests" value={joinFacts(profile.fundingInterests)} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete your profile so Koru can pre-fill this section for you.
            </p>
          )}

          <div className="space-y-2">
            <label className="label-mono text-muted-foreground">One line about you</label>
            <Textarea
              value={answers.personalStatement ?? ""}
              onChange={(e) => setAnswer("personalStatement", e.target.value)}
              placeholder="e.g. Recent graduate in marine science from Suva, working to protect coastal fisheries."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Proposal */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Proposal</CardTitle>
          <CardDescription>Draft from your profile, or write your own from the outline in the Assistant tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={answers.proposal ?? ""}
            onChange={(e) => setAnswer("proposal", e.target.value)}
            placeholder="Write your proposal here. Koru only drafts from facts in your profile, notes, and the opportunity details."
            rows={10}
          />
          <div className="flex justify-end">
            <Button onClick={handleDraft} disabled={drafting}>
              {drafting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="mr-1.5 h-4 w-4" />
              )}
              Draft from my profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents needed */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Documents needed</CardTitle>
          <CardDescription>Upload them in the Documents tab so they are ready when you submit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredDocuments.length > 0 ? (
            <ul className="space-y-2">
              {requiredDocuments.map((doc, i) => (
                <li key={i} className="flex items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{doc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No required documents listed for this opportunity. Check the official page for details.
            </p>
          )}
          <Button variant="outline" size="sm" onClick={onGoToDocuments}>
            Go to Documents tab
          </Button>
        </CardContent>
      </Card>

      {/* Review & submit */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Review &amp; submit</CardTitle>
          <CardDescription>Read your answers, copy them, then finish on the official portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {filledSections.length > 0 ? (
            <div className="space-y-4 border p-4">
              {filledSections.map((field) => (
                <div key={field}>
                  <p className="label-mono mb-1.5 text-muted-foreground">{FIELD_LABELS[field] ?? field}</p>
                  <RichText text={answers[field] ?? ""} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to review yet. Fill in the sections above and save.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="mr-1.5 h-4 w-4" /> Copy answers
            </Button>
            {applicationUrl && (
              <Button asChild>
                <a href={applicationUrl} target="_blank" rel="noreferrer">
                  Open official portal <ExternalLink className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Always confirm the final requirements on the official page before you submit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-l-2 border-border pl-3">
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value && value.trim() ? value.trim() : "Not set"}</dd>
    </div>
  );
}

function joinFacts(items: string[] | null | undefined): string | null {
  const clean = (items ?? []).map((i) => i.trim()).filter(Boolean);
  return clean.length > 0 ? clean.join(", ") : null;
}
