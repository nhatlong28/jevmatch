"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";

import { EvaluationPlanEditor } from "@/components/evaluation-plan-editor";
import { Button } from "@/components/ui/button";
import {
  type EvaluationPlan,
  type ValidationIssue,
  validateEvaluationPlan,
} from "@/lib/domain/evaluation-plan";
import {
  type EvaluationPlanEditorAction,
  evaluationPlanEditorReducer,
} from "@/lib/domain/evaluation-plan-editor";

type EvaluationPlanGeneratorProps = {
  initialPlan: EvaluationPlan | null;
  jobId: string;
};

type ApiResponse = {
  error?: string;
  id?: string;
  issues?: ValidationIssue[];
  plan?: EvaluationPlan;
};

export function EvaluationPlanGenerator({
  initialPlan,
  jobId,
}: EvaluationPlanGeneratorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [plan, dispatch] = useReducer(
    evaluationPlanEditorReducer,
    initialPlan,
  );
  const [isWorking, setIsWorking] = useState(false);
  const [isPublishConfirmed, setIsPublishConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);

  function editPlan(action: EvaluationPlanEditorAction) {
    setError(null);
    setIssues([]);
    setSaved(false);
    setIsPublishConfirmed(false);
    dispatch(action);
  }

  async function generate() {
    setError(null);
    setIssues([]);
    setSaved(false);
    setIsWorking(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/evaluation-plan`, {
        method: "POST",
      });
      const body = (await response.json()) as ApiResponse;

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

    setError(null);
    setIssues([]);
    setSaved(false);
    setIsWorking(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/evaluation-plan`, {
        body: JSON.stringify({ action, confirmed: isPublishConfirmed, plan }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const body = (await response.json()) as ApiResponse;

      if (!response.ok || !body.id) {
        setIssues(body.issues ?? []);
        setError(body.error ?? "We could not save this evaluation plan.");
        return;
      }

      if (action === "publish") {
        router.refresh();
      } else {
        setSaved(true);
      }
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="mt-8 space-y-5 rounded-lg border bg-card p-5 shadow-sm sm:p-7">
      {error ? (
        <p aria-live="polite" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p aria-live="polite" className="text-sm text-success" role="status">
          Draft saved. You can leave this page and return to continue editing.
        </p>
      ) : null}

      {plan ? (
        <>
          <EvaluationPlanEditor
            dispatch={editPlan}
            issues={issues}
            plan={plan}
          />
          <label className="flex gap-3 rounded-md border bg-surface p-4 text-sm">
            <input
              checked={isPublishConfirmed}
              className="mt-0.5 size-4"
              onChange={(event) => setIsPublishConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>
              I have reviewed this plan. Publishing locks every question and
              criterion for all candidate evaluations and cannot be undone.
            </span>
          </label>
          <div className="flex flex-wrap gap-3 border-t pt-4">
            <Button
              disabled={isWorking || !isPublishConfirmed}
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
            <Button
              disabled={isWorking}
              onClick={generate}
              type="button"
              variant="outline"
            >
              Generate again
            </Button>
          </div>
        </>
      ) : (
        <div>
          <p className="text-sm font-medium">Evaluation plan</p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate a draft from this job description. You will review and edit
            every question before publishing.
          </p>
          <Button
            className="mt-5"
            disabled={isWorking}
            onClick={generate}
            type="button"
          >
            {isWorking ? "Generating plan…" : "Generate evaluation plan"}
          </Button>
        </div>
      )}
    </section>
  );
}
