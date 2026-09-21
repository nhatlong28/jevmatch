"use client";

import { useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type EvaluationPlan,
  type EvaluationQuestion,
  IMPORTANCE_VALUES,
  type Importance,
} from "@/lib/domain/evaluation-plan";
import {
  type EvaluationPlanEditorAction,
  evaluationPlanEditorReducer,
} from "@/lib/domain/evaluation-plan-editor";

type Mode = "paste" | "upload";

type ApiResponse = {
  error?: string;
  id?: string;
  plan?: EvaluationPlan;
};

function newQuestion(): EvaluationQuestion {
  return {
    id: `question_${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`,
    importance: "core",
    jev: {
      type: "noul",
      instructions: "Does resume demonstrate the relevant qualification?",
    },
  };
}

export function JobForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>("paste");
  const [error, setError] = useState<string | null>(null);
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
    const formData = getFormData();
    if (!formData) return;

    setError(null);
    setIsWorking(true);
    formData.set("action", action);
    formData.set("evaluationPlan", JSON.stringify(plan));
    try {
      const { response, body } = await request(formData, "/api/jobs");
      if (!response.ok || !body.id) {
        setError(body.error ?? "We could not save this job. Try again.");
        return;
      }
      router.push(`/jobs/${body.id}`);
    } finally {
      setIsWorking(false);
    }
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
          <div>
            <p className="font-medium">Evaluation plan</p>
            <p className="text-sm text-muted-foreground">
              Review every question before saving. Importance affects
              deterministic scoring and is not sent to Jev.
            </p>
          </div>

          {plan.questions.map((question, questionIndex) => (
            <QuestionEditor
              dispatch={dispatch}
              key={questionIndex}
              question={question}
              questionIndex={questionIndex}
            />
          ))}

          <Button
            onClick={() =>
              dispatch({ type: "add-question", question: newQuestion() })
            }
            type="button"
            variant="outline"
          >
            Add question
          </Button>

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

type QuestionEditorProps = {
  dispatch: (action: EvaluationPlanEditorAction) => void;
  question: EvaluationQuestion;
  questionIndex: number;
};

function QuestionEditor({
  dispatch,
  question,
  questionIndex,
}: QuestionEditorProps) {
  return (
    <div className="space-y-3 rounded-md border bg-card p-4">
      <div className="flex items-end justify-between gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium">
          Question ID
          <Input
            className="mt-1"
            onChange={(event) =>
              dispatch({
                type: "set-question-id",
                questionIndex,
                id: event.target.value,
              })
            }
            value={question.id}
          />
        </label>
        <Button
          onClick={() => dispatch({ type: "delete-question", questionIndex })}
          size="sm"
          type="button"
          variant="destructive"
        >
          Delete
        </Button>
      </div>

      <label className="block text-sm font-medium">
        Instructions
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border bg-surface px-3 py-2 text-sm"
          onChange={(event) =>
            dispatch({
              type: "set-question-instructions",
              questionIndex,
              instructions: event.target.value,
            })
          }
          value={question.jev.instructions}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Importance
          <select
            className="mt-1 w-full rounded-md border bg-surface p-2"
            onChange={(event) =>
              dispatch({
                type: "set-question-importance",
                questionIndex,
                importance: event.target.value as Importance,
              })
            }
            value={question.importance}
          >
            {IMPORTANCE_VALUES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Type
          <select
            className="mt-1 w-full rounded-md border bg-surface p-2"
            onChange={(event) =>
              dispatch({
                type: "set-question-type",
                questionIndex,
                questionType: event.target.value as "noul" | "score",
              })
            }
            value={question.jev.type}
          >
            <option value="noul">Noul</option>
            <option value="score">Score</option>
          </select>
        </label>
      </div>

      {question.jev.type === "score" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Criteria, weakest to strongest</p>
          {question.jev.criteria.map((criterion, criterionIndex) => (
            <div className="flex items-center gap-2" key={criterionIndex}>
              <Input
                aria-label={`Criterion ${criterionIndex + 1}`}
                onChange={(event) =>
                  dispatch({
                    type: "set-criterion",
                    questionIndex,
                    criterionIndex,
                    criterion: event.target.value,
                  })
                }
                value={criterion}
              />
              <Button
                aria-label={`Delete criterion ${criterionIndex + 1}`}
                onClick={() =>
                  dispatch({
                    type: "delete-criterion",
                    questionIndex,
                    criterionIndex,
                  })
                }
                size="sm"
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Score questions require at least two non-empty criteria before
            saving.
          </p>
          <Button
            onClick={() => dispatch({ type: "add-criterion", questionIndex })}
            size="sm"
            type="button"
            variant="outline"
          >
            Add criterion
          </Button>
        </div>
      ) : null}
    </div>
  );
}
