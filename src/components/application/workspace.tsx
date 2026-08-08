"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  PenLine,
  Save,
  Loader2,
  ExternalLink,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScoreRing } from "@/components/shared/score";
import { DeadlineBar } from "@/components/shared/deadline-bar";
import { EligibilityPanel } from "@/components/opportunities/eligibility-panel";
import { ApplicationFormTab } from "@/components/application/application-form";
import { RichText } from "@/components/application/rich-text";
import { DOCUMENT_TYPES, DOCUMENT_LABELS, TASK_CATEGORY_LABELS, APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { deadlineLabel } from "@/lib/deadlines";
import type { EligibilityResult, TaskDto, DocumentDto } from "@/lib/types";
import type { ProfileFacts } from "@/lib/smartfill";
import {
  addTask,
  deleteApplication,
  deleteTask,
  toggleTask,
  updateApplicationNotes,
  updateApplicationStatus,
} from "@/server/actions/applications";
import {
  attachDocumentToApplication,
  deleteDocument,
} from "@/server/actions/documents";
import { aiOutline, aiRewrite } from "@/server/actions/ai";

interface WorkspaceOpportunity {
  id: string;
  title: string;
  providerName: string;
  deadline: Date | string | null;
  isRolling: boolean;
  applicationUrl: string | null;
  category: string;
  estimatedHours: number;
  stages: { name: string; description: string; order: number }[];
  requiredDocuments: string[];
}

interface WorkspaceApp {
  id: string;
  status: string;
  completion: number;
  notes: string | null;
  startedAt: Date | string;
  updatedAt: Date | string;
  opportunity: WorkspaceOpportunity;
  rules: unknown[];
  tasks: TaskDto[];
  documents: DocumentDto[];
}

type VaultDoc = { id: string; name: string; type: string; url: string | null };

export function ApplicationWorkspace({
  application,
  vaultDocuments,
  eligibility,
  requiredDocuments,
  applicationUrl,
  profile,
}: {
  application: WorkspaceApp;
  vaultDocuments: VaultDoc[];
  eligibility: EligibilityResult;
  requiredDocuments: string[];
  applicationUrl: string | null;
  profile: ProfileFacts | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState("checklist");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Notes + AI state
  const [notes, setNotes] = useState(application.notes ?? "");
  const [outlineContext, setOutlineContext] = useState("");
  const [rewriteText, setRewriteText] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  // New task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  const opp = application.opportunity;

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong.");
      }
      router.refresh();
    });

  async function handleUpload(file: File, type: string) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("applicationId", application.id);
      fd.append("type", type);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      toast.success("Document uploaded");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function runAi(task: "outline" | "rewrite") {
    setAiBusy(true);
    setAiOutput("");
    try {
      const res =
        task === "outline"
          ? await aiOutline(application.id, outlineContext)
          : await aiRewrite(rewriteText);
      if (res.ok) setAiOutput(res.text ?? "");
      else toast.error(res.error ?? "AI request failed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <Link href="/applications" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All applications
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div className="min-w-0">
          <p className="label-mono text-muted-foreground">{opp.providerName}</p>
          <h1 className="mt-1 font-display text-3xl font-light leading-tight tracking-tight">{opp.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {opp.isRolling ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-4 w-4" /> Rolling deadline
              </span>
            ) : opp.deadline ? (
              <DeadlineBar deadline={new Date(opp.deadline)} />
            ) : null}
            {opp.applicationUrl && (
              <a
                href={opp.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Official portal <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <ScoreRing value={application.completion} size={64} stroke={6} label="Completion" />
            <p className="mt-1 text-xs text-muted-foreground">complete</p>
          </div>
          <div className="flex flex-col gap-2">
            <Select
              value={application.status}
              onValueChange={(v) => run(() => updateApplicationStatus(application.id, v))}
            >
              <SelectTrigger className="w-44" aria-label="Application status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DeleteAppButton appId={application.id} appTitle={opp.title} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="documents">
              Documents{application.documents.length > 0 ? ` (${application.documents.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="form">Application form</TabsTrigger>
          </TabsList>

          {/* CHECKLIST */}
          <TabsContent value="checklist" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  Checklist
                  <span className="text-xs font-normal text-muted-foreground">
                    {application.tasks.filter((t) => t.completed).length}/{application.tasks.length} done
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {application.tasks.length === 0 && (
                  <p className="py-4 text-sm text-muted-foreground">Add your first task below.</p>
                )}
                {application.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={() => run(() => toggleTask(task.id))} onDelete={() => run(() => deleteTask(task.id))} />
                ))}

                <form
                  className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newTaskTitle.trim().length < 2) return;
                    run(async () => {
                      await addTask(application.id, {
                        title: newTaskTitle.trim(),
                        dueDate: newTaskDue || undefined,
                        category: "other",
                        priority: "medium",
                      });
                      setNewTaskTitle("");
                      setNewTaskDue("");
                    });
                  }}
                >
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a task…"
                    className="flex-1"
                    aria-label="New task title"
                  />
                  <Input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className="sm:w-40" aria-label="New task due date" />
                  <Button type="submit" size="icon" disabled={newTaskTitle.trim().length < 2}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Application timeline</span>
                  <span className="text-xs text-muted-foreground">
                    Started {new Date(application.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="h-1.5 bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-700"
                    style={{ width: `${application.completion}%` }}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  {opp.stages.length > 0 ? (
                    opp.stages.map((stage) => (
                      <div key={stage.order} className="flex items-start gap-3">
                        <span className="label-mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-primary/40 text-primary">
                          {stage.order}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{stage.name}</p>
                          {stage.description && <p className="text-xs text-muted-foreground">{stage.description}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No stages published for this opportunity.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <UploadForm
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                  onFile={(file, type) => handleUpload(file, type)}
                />

                {application.documents.length > 0 ? (
                  <ul className="divide-y">
                    {application.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-3 py-2.5">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {DOCUMENT_LABELS[doc.type] ?? doc.type}
                            {doc.isReusable ? " · reusable" : ""}
                          </p>
                        </div>
                        {doc.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.url} target="_blank" rel="noreferrer">
                              View
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label="Remove document" onClick={() => run(() => deleteDocument(doc.id))}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded for this application yet.</p>
                )}
              </CardContent>
            </Card>

            {vaultDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reuse from your vault</CardTitle>
                  <p className="text-xs text-muted-foreground">Link a vault document to this application in one click.</p>
                </CardHeader>
                <CardContent className="space-y-1">
                  {vaultDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 py-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{doc.name}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => run(() => attachDocumentToApplication(application.id, doc.id))}>
                        Use this
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ELIGIBILITY */}
          <TabsContent value="eligibility" className="mt-4">
            <div className="mx-auto max-w-xl">
              <EligibilityPanel result={eligibility} />
            </div>
          </TabsContent>

          {/* NOTES */}
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Draft proposal ideas, contact names, links, to-dos…"
                  rows={12}
                  className="resize-y"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => run(() => updateApplicationNotes(application.id, notes))}
                    disabled={isPending || notes === (application.notes ?? "")}
                  >
                    {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                    Save notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSISTANT */}
          <TabsContent value="assistant" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-[18px] w-[18px] text-primary" /> Proposal assistant
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Suggests outlines and rewrites drafts. Facts and figures are never invented. You write the
                  final version.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Suggest a proposal outline</label>
                  <Textarea
                    value={outlineContext}
                    onChange={(e) => setOutlineContext(e.target.value)}
                    placeholder="Describe your project or idea in a few sentences… (optional, uses your notes by default)"
                    rows={3}
                  />
                  <Button onClick={() => runAi("outline")} disabled={aiBusy}>
                    {aiBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PenLine className="mr-1.5 h-4 w-4" />}
                    Generate outline
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rewrite a draft</label>
                  <Textarea
                    value={rewriteText}
                    onChange={(e) => setRewriteText(e.target.value)}
                    placeholder="Paste a draft paragraph to improve clarity…"
                    rows={5}
                  />
                  <Button variant="outline" onClick={() => runAi("rewrite")} disabled={aiBusy || rewriteText.trim().length < 20}>
                    {aiBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                    Rewrite draft
                  </Button>
                </div>

                {aiOutput && (
                  <div className="border bg-muted/40 p-4">
                    <RichText text={aiOutput} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* APPLICATION FORM */}
          <TabsContent value="form" className="mt-4">
            <ApplicationFormTab
              applicationId={application.id}
              requiredDocuments={requiredDocuments}
              applicationUrl={applicationUrl}
              profile={profile}
              onGoToDocuments={() => setTab("documents")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: TaskDto;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 py-1">
      <button onClick={onToggle} aria-label={task.completed ? "Mark not done" : "Mark done"} className="shrink-0">
        {task.completed ? (
          <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
        ) : (
          <Circle className="h-[18px] w-[18px] text-muted-foreground transition-colors hover:text-primary" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.completed ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
        <p className="text-xs text-muted-foreground">
          {TASK_CATEGORY_LABELS[task.category] ?? task.category}
          {task.dueDate ? ` · ${deadlineLabel(task.dueDate)}` : ""}
          {task.priority === "high" || task.priority === "urgent" ? ` · ${task.priority}` : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Delete task"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

function UploadForm({
  uploading,
  fileInputRef,
  onFile,
}: {
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File, type: string) => void;
}) {
  const [type, setType] = useState("other");
  const [fileName, setFileName] = useState("");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium">Document type</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label="Document type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium">File</label>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-dashed"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-4 w-4" />
          {fileName || "Choose a file (PDF, DOC, XLS, image)"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFileName(f.name);
              onFile(f, type);
              e.target.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}

function DeleteAppButton({ appId, appTitle }: { appId: string; appTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this application?</DialogTitle>
          <DialogDescription>
            This removes the workspace for &ldquo;{appTitle}&rdquo; including its tasks and linked documents. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteApplication(appId);
                router.push("/applications");
                router.refresh();
              })
            }
          >
            Delete application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
