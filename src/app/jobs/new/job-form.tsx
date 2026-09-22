"use client";

import { useReducer, useRef, useState } from "react";
import { ClipboardPasteIcon, FileUpIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";
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
      const { response, body } = await request(
        formData,
        "/api/evaluation-plans/generate",
      );
      if (!response.ok || !body.plan) {
        setError(
          body.error ?? "We could not generate an evaluation plan. Try again.",
        );
        return;
      }
      dispatch({ type: "set-plan", plan: body.plan });
    } finally {
      setIsWorking(false);
    }
  }

  async function save() {
    if (!plan) return;
    const validation = validateEvaluationPlan(plan);
    if (!validation.success) {
      setIssues(validation.issues);
      setError("Fix the highlighted fields before saving.");
      return;
    }
    const formData = getFormData();
    if (!formData) return;

    setError(null);
    setIsWorking(true);
    formData.set("evaluationPlan", JSON.stringify(plan));
    try {
      const { response, body } = await request(formData, "/api/jobs");
      if (!response.ok || !body.id) {
        setIssues(body.issues ?? []);
        setError(body.error ?? "We could not save this job. Try again.");
        return;
      }
      router.push(`/jobs/${body.id}`);
    } finally {
      setIsWorking(false);
    }
  }

  function editPlan(action: EvaluationPlanEditorAction) {
    setError(null);
    setIssues([]);
    dispatch(action);
  }

  return (
    <form
      className="space-y-7"
      onSubmit={(event) => event.preventDefault()}
      ref={formRef}
    >
      <div className="max-w-xl space-y-2">
        <label className="text-sm font-medium" htmlFor="title">
          Job title
        </label>
        <Input
          className="h-11 rounded-xl"
          id="title"
          name="title"
          placeholder="Senior Frontend Engineer"
          required
        />
      </div>

      <fieldset className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <legend className="text-sm font-medium">Job Description</legend>
          <p className="text-xs text-muted-foreground">Paste text or upload a supported file.</p>
        </div>
        <div
          aria-label="Job description source"
          className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/35 p-1"
          role="tablist"
        >
          <Button
            aria-selected={mode === "paste"}
            className="w-full justify-center"
            onClick={() => setMode("paste")}
            role="tab"
            type="button"
            variant={mode === "paste" ? "default" : "ghost"}
          >
            <ClipboardPasteIcon data-icon="inline-start" />
            Paste text
          </Button>
          <Button
            aria-selected={mode === "upload"}
            className="w-full justify-center"
            onClick={() => setMode("upload")}
            role="tab"
            type="button"
            variant={mode === "upload" ? "default" : "ghost"}
          >
            <FileUpIcon data-icon="inline-start" />
            Upload file
          </Button>
        </div>

        {mode === "paste" ? (
          <textarea
            className="min-h-72 w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            id="jdText"
            name="jdText"
            placeholder="Paste the full job description here."
            required
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/20 p-5 sm:p-6">
            <label className="flex cursor-pointer flex-col items-center justify-center text-center" htmlFor="jdFile">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <FileUpIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="mt-3 text-sm font-medium">Choose a Job Description file</span>
              <span className="mt-1 text-sm text-muted-foreground">PDF, DOCX, or UTF-8 TXT up to 10 MB.</span>
            </label>
            <Input
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="mt-5 h-10 rounded-xl"
              id="jdFile"
              name="jdFile"
              required
              type="file"
            />
          </div>
        )}
      </fieldset>

      {error ? (
        <p aria-live="polite" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!plan ? (
        <Button disabled={isWorking} onClick={generate} type="button">
          {isWorking ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
          {isWorking ? "Generating plan…" : "Generate evaluation plan"}
        </Button>
      ) : (
        <section className="space-y-5 rounded-[14px] border bg-muted/25 p-4 sm:p-5">
          <EvaluationPlanEditor
            dispatch={editPlan}
            issues={issues}
            plan={plan}
          />

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <Button
              disabled={isWorking}
              onClick={save}
              type="button"
            >
              {isWorking ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </section>
      )}
    </form>
  );
}
