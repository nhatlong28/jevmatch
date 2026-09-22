"use client";

import { useReducer, useRef, useState } from "react";
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

  async function save(action: "save-draft" | "publish") {
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
    formData.set("action", action);
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
      className="space-y-6"
      onSubmit={(event) => event.preventDefault()}
      ref={formRef}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="title">
          Job title
        </label>
        <Input
          id="title"
          name="title"
          placeholder="Senior Frontend Engineer"
          required
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Job description</legend>
        <div
          aria-label="Job description source"
          className="flex gap-2"
          role="tablist"
        >
          <Button
            aria-selected={mode === "upload"}
            onClick={() => setMode("upload")}
            role="tab"
            type="button"
            variant={mode === "upload" ? "default" : "outline"}
          >
            Upload file
          </Button>
          <Button
            aria-selected={mode === "paste"}
            onClick={() => setMode("paste")}
            role="tab"
            type="button"
            variant={mode === "paste" ? "default" : "outline"}
          >
            Paste text
          </Button>
        </div>

        {mode === "paste" ? (
          <textarea
            className="min-h-64 w-full rounded-md border bg-surface px-3 py-2 text-sm"
            id="jdText"
            name="jdText"
            placeholder="Paste the full job description here."
            required
          />
        ) : (
          <div className="rounded-md border border-dashed bg-surface p-5">
            <label className="block text-sm font-medium" htmlFor="jdFile">
              Job description file
            </label>
            <Input
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="mt-3"
              id="jdFile"
              name="jdFile"
              required
              type="file"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              PDF, DOCX, or UTF-8 TXT, up to 10 MB.
            </p>
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
          {isWorking ? "Generating plan…" : "Generate evaluation plan"}
        </Button>
      ) : (
        <section className="space-y-4 rounded-lg border bg-surface p-4">
          <EvaluationPlanEditor
            dispatch={editPlan}
            issues={issues}
            plan={plan}
          />

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={isWorking}
              onClick={() => save("publish")}
              type="button"
            >
              {isWorking ? "Saving…" : "Publish job"}
            </Button>
            <Button
              disabled={isWorking}
              onClick={() => save("save-draft")}
              type="button"
              variant="outline"
            >
              Save draft
            </Button>
          </div>
        </section>
      )}
    </form>
  );
}
