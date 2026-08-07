"use client";

import { useState, useTransition } from "react";
import { Sparkles, Send, FileCheck, ListChecks, PenLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  aiAsk,
  aiChecklist,
  aiExplainEligibility,
  aiOutline,
} from "@/server/actions/ai";

function RichText({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### ") || line.startsWith("## ")) {
          return (
            <h4 key={i} className="mt-3 mb-1 font-display text-base font-medium">
              {line.replace(/^#+\s*/, "")}
            </h4>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold">
              {line.slice(2, -2)}
            </p>
          );
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j}>{p.slice(2, -2)}</strong>
          ) : (
            p
          ),
        );
        return (
          <p key={i} className="min-h-[1.25rem]">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

export function AiPanel({ opportunityId, applicationId }: { opportunityId: string; applicationId?: string }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const startTransition = useTransition()[1];

  function run(task: string, fn: () => Promise<{ ok: boolean; text?: string; error?: string }>) {
    setBusyTask(task);
    setResponse("");
    startTransition(async () => {
      const res = await fn();
      if (res.ok) setResponse(res.text ?? "");
      else toast.error(res.error ?? "Something went wrong.");
      setBusyTask(null);
    });
  }

  const busy = busyTask !== null;

  return (
    <section className="border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="h-[18px] w-[18px] text-primary" />
        <div>
          <h2 className="font-display text-lg font-medium">Koru Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Grounded in this opportunity&apos;s official details only. Koru never invents facts.
          </p>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run("eligibility", () => aiExplainEligibility(opportunityId))}
          >
            {busyTask === "eligibility" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileCheck className="mr-1.5 h-4 w-4" />}
            Explain my eligibility
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run("checklist", () => aiChecklist(opportunityId))}
          >
            {busyTask === "checklist" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ListChecks className="mr-1.5 h-4 w-4" />}
            Generate checklist
          </Button>
          {applicationId && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => run("outline", () => aiOutline(applicationId, ""))}
            >
              {busyTask === "outline" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PenLine className="mr-1.5 h-4 w-4" />}
              Proposal outline
            </Button>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim().length < 3) return;
            run("ask", () => aiAsk(opportunityId, question));
          }}
        >
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about requirements, documents, deadlines"
            aria-label="Ask Koru Assistant"
          />
          <Button type="submit" size="icon" disabled={busy || question.trim().length < 3} aria-label="Ask">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {response && (
          <div className="border bg-muted/40 p-4">
            <RichText text={response} />
          </div>
        )}
      </div>
    </section>
  );
}
