"use client";

import { useReducer, useRef, useState } from "react";
import { CheckCircle2Icon, ClipboardPasteIcon, FileUpIcon, InfoIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EvaluationPlanEditor } from "@/components/evaluation-plan-editor";
import { Input } from "@/components/ui/input";
import {
  type EvaluationPlan,
  type ValidationIssue,
  validateEvaluationPlan,
} from "@/lib/domain/evaluation-plan";
import {
  type EvaluationPlanEditorAction,
  evaluationPlanEditorReducer,
} from "@/lib/domain/evaluation-plan-editor";

type Mode = "paste" | "upload";

type ApiResponse = {
  error?: string;
  id?: string;
  issues?: ValidationIssue[];
  plan?: EvaluationPlan;
};

export function JobForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>("paste");
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [plan, dispatch] = useReducer(evaluationPlanEditorReducer, null);
  const [isWorking, setIsWorking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [descriptionReady, setDescriptionReady] = useState(false);
  const [isPublishConfirmed, setIsPublishConfirmed] = useState(false);

  function getFormData() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return null;

    const formData = new FormData(form);
    if (mode === "paste") formData.delete("jdFile");
    else formData.delete("jdText");
    return formData;
  }

  async function request(formData: FormData, url: string) {
    const response = await fetch(url, { body: formData, method: "POST" });
    return { response, body: (await response.json()) as ApiResponse };
  }

  async function generate() {
    const formData = getFormData();
    if (!formData) return;

    setError(null);
    setIsWorking(true);
    try {
      const { response, body } = await request(formData, "/api/evaluation-plans/generate");
      if (!response.ok || !body.plan) {
        setError(body.error ?? "We could not generate an evaluation plan. Try again.");
        return;
      }
      dispatch({ type: "set-plan", plan: body.plan });
    } catch {
      setError("We could not generate an evaluation plan. Check your connection and try again.");
    } finally {
      setIsWorking(false);
    }
  }

  async function save(action: "save-draft" | "publish") {
    if (plan) {
      const validation = validateEvaluationPlan(plan);
      if (!validation.success) {
        setIssues(validation.issues);
        setError("Fix the highlighted fields before saving.");
        return;
      }
    }
    if (action === "publish" && (!plan || !isPublishConfirmed)) return;
    const formData = getFormData();
    if (!formData) return;

    setError(null);
    setIsWorking(true);
    setIsSaving(true);
    setIsPublishing(action === "publish");
    formData.set("action", action);
    formData.set("confirmed", String(isPublishConfirmed));
    if (plan) formData.set("evaluationPlan", JSON.stringify(plan));
    try {
      const { response, body } = await request(formData, "/api/jobs");
      if (!response.ok || !body.id) {
        setIssues(body.issues ?? []);
        setError(body.error ?? "We could not save this job. Try again.");
        return;
      }
      router.push(`/jobs/${body.id}`);
    } catch {
      setError("We could not save this job. Check your connection and try again.");
    } finally {
      setIsWorking(false);
      setIsSaving(false);
      setIsPublishing(false);
    }
  }

  function editPlan(action: EvaluationPlanEditorAction) {
    setError(null);
    setIssues([]);
    setIsPublishConfirmed(false);
    dispatch(action);
  }

  function updateRoleReady() {
    const form = formRef.current;
    if (!form) return;
    const fields = new FormData(form);
    setRoleReady(Boolean(String(fields.get("title") ?? "").trim()) && Boolean(String(fields.get("location") ?? "").trim()));
  }

  const checklist = [
    ["Role details are complete", roleReady ? "Job title and location are filled in." : "Add a job title and location." , roleReady],
    ["Job description is ready", descriptionReady ? "Description is available for evaluation-plan generation." : "Paste a description or choose a file.", descriptionReady],
    ["Evaluation plan is editable", Boolean(plan) ? "Review questions and scoring before publishing." : "Generate a plan now or save this draft for later.", Boolean(plan)],
  ] as const;
  const planValidation = plan ? validateEvaluationPlan(plan) : null;
  const canPublish = planValidation?.success === true && isPublishConfirmed;

  return (
    <form className="space-y-5" id="create-job-form" onSubmit={(event) => event.preventDefault()} ref={formRef}>
      <header className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground"><Link className="hover:text-foreground" href="/jobs">Jobs</Link><span aria-hidden="true"> / </span>New job</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Create a job</h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-6 text-muted-foreground">Add the role details and Job Description. Jev Match will prepare an editable evaluation-plan draft for your review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isWorking} onClick={() => void save("save-draft")} type="button" variant="outline">
            {isSaving ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : null}
            {isSaving ? "Saving draft…" : "Save draft"}
          </Button>
          <Button disabled={isWorking || !canPublish} onClick={() => void save("publish")} title={!plan ? "Generate an Evaluation Plan first" : planValidation?.success === false ? "Fix the Evaluation Plan issues before publishing" : !isPublishConfirmed ? "Confirm that you reviewed the Evaluation Plan" : undefined} type="button">
            {isPublishing ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : null}
            {isPublishing ? "Publishing…" : "Publish job"}
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6 rounded-xl border bg-surface p-5 sm:p-7" aria-labelledby="role-details-title">
          <div className="border-b pb-5">
            <h2 className="text-xl font-semibold tracking-[-0.025em]" id="role-details-title">Role details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add a title, location, and the source Job Description.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium" htmlFor="title">
              Job title <span className="text-primary">*</span>
              <Input className="mt-2 h-11 rounded-lg" id="title" name="title" onChange={updateRoleReady} placeholder="Senior Frontend Engineer" required />
            </label>
            <label className="block text-sm font-medium" htmlFor="location">
              Location <span className="text-primary">*</span>
              <Input className="mt-2 h-11 rounded-lg" id="location" name="location" onChange={updateRoleReady} placeholder="Remote, city, or region" required />
            </label>
          </div>

          <fieldset className="space-y-3 border-t pt-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <legend className="text-sm font-semibold">Job Description</legend>
              <p className="text-xs text-muted-foreground">Paste text or upload a supported file.</p>
            </div>
            <div aria-label="Job description source" className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/35 p-1" role="tablist">
              <Button aria-selected={mode === "paste"} className="w-full justify-center" onClick={() => setMode("paste")} role="tab" type="button" variant={mode === "paste" ? "default" : "ghost"}>
                <ClipboardPasteIcon data-icon="inline-start" /> Paste text
              </Button>
              <Button aria-selected={mode === "upload"} className="w-full justify-center" onClick={() => setMode("upload")} role="tab" type="button" variant={mode === "upload" ? "default" : "ghost"}>
                <FileUpIcon data-icon="inline-start" /> Upload file
              </Button>
            </div>

            {mode === "paste" ? (
              <textarea className="min-h-72 w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" id="jdText" name="jdText" onChange={(event) => setDescriptionReady(Boolean(event.currentTarget.value.trim()))} placeholder="Paste the full job description here." required />
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/20 p-5 sm:p-6">
                <label className="flex cursor-pointer flex-col items-center justify-center text-center" htmlFor="jdFile">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><FileUpIcon aria-hidden="true" className="size-4" /></span>
                  <span className="mt-3 text-sm font-medium">Choose a Job Description file</span>
                  <span className="mt-1 text-sm text-muted-foreground">PDF, DOCX, or UTF-8 TXT up to 10 MB.</span>
                </label>
                <Input accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="mt-5 h-10 rounded-lg" id="jdFile" name="jdFile" onChange={(event) => setDescriptionReady(Boolean(event.currentTarget.files?.length))} required type="file" />
              </div>
            )}
          </fieldset>

          {error ? <p aria-live="polite" className="text-sm text-destructive" role="alert">{error}</p> : null}
          {plan ? (
            <section className="space-y-5 border-t pt-6" aria-labelledby="generated-plan-title">
              <h2 className="text-xl font-semibold tracking-[-0.025em]" id="generated-plan-title">Evaluation plan draft</h2>
              <EvaluationPlanEditor dispatch={editPlan} issues={issues} plan={plan} />
              <label className="flex gap-3 rounded-lg border bg-muted/35 p-4 text-sm">
                <input checked={isPublishConfirmed} className="mt-0.5 size-4" onChange={(event) => setIsPublishConfirmed(event.target.checked)} type="checkbox" />
                <span>I have reviewed this plan. Publishing locks every question and criterion for all candidate evaluations and cannot be undone.</span>
              </label>
            </section>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Generate an editable Evaluation Plan from this role and its Job Description.</p>
              <Button className="shrink-0" disabled={isWorking || !roleReady || !descriptionReady} onClick={() => void generate()} type="button">
                {isWorking ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
                {isWorking ? "Generating plan…" : "Generate evaluation plan"}
              </Button>
            </div>
          )}
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <section className="rounded-xl border bg-surface p-5">
            <h2 className="text-lg font-semibold">Before you generate</h2>
            <ul className="mt-5 grid gap-5 text-sm">
              {checklist.map(([title, description, complete]) => (
                <li className="flex gap-3" key={title}>
                  <CheckCircle2Icon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${complete ? "text-success" : "text-muted-foreground/50"}`} />
                  <span><span className="block font-medium text-foreground">{title}</span><span className="mt-1 block leading-5 text-muted-foreground">{description}</span></span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t pt-5">
              <div className="flex gap-3 rounded-lg border border-primary/25 bg-primary-soft/55 p-3 text-sm">
                <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="leading-5 text-secondary-foreground">The generated plan is a draft. Review every question, type, and importance before publishing.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
