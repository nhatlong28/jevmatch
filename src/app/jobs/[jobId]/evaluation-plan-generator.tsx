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
  const questionCounts = plan?.questions.reduce(
    (counts, question) => ({
      ...counts,
      [question.importance]: counts[question.importance] + 1,
      total: counts.total + 1,
    }),
    { core: 0, preferred: 0, required: 0, total: 0 },
  ) ?? { core: 0, preferred: 0, required: 0, total: 0 };

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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
    <section className="space-y-5 rounded-[14px] border bg-surface p-5 sm:p-7">
      {error ? (
        <p aria-live="polite" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p aria-live="polite" className="rounded-xl border border-success/25 bg-success-soft p-3 text-sm text-success" role="status">
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
          <label className="flex gap-3 rounded-xl border bg-muted/35 p-4 text-sm">
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
          <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
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
        <div className="py-5">
          <p className="text-lg font-semibold">Generate the first draft</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
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
    <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
      <section className="rounded-[14px] border bg-surface p-5">
        <h2 className="text-lg font-semibold">Plan summary</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          {[
            ["Total questions", questionCounts.total],
            ["Required", questionCounts.required],
            ["Core", questionCounts.core],
            ["Preferred", questionCounts.preferred],
          ].map(([label, value]) => (
            <div className="flex items-center justify-between gap-4" key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-[14px] border border-primary/25 bg-primary-soft/55 p-4 text-sm leading-5 text-secondary-foreground">
        Importance affects deterministic scoring. It is not sent to Jev.
      </section>
      <section className="rounded-[14px] border bg-surface p-5 text-sm">
        <h2 className="font-semibold">Publish validation</h2>
        <p className="mt-2 leading-5 text-muted-foreground">
          Publishing requires at least one valid question and locks the plan for
          every candidate evaluation.
        </p>
      </section>
    </aside>
    </div>
  );
}
