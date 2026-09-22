"use client";

import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IMPORTANCE_VALUES,
  type EvaluationPlan,
  type EvaluationQuestion,
  type Importance,
  type ValidationIssue,
} from "@/lib/domain/evaluation-plan";
import type { EvaluationPlanEditorAction } from "@/lib/domain/evaluation-plan-editor";

type EvaluationPlanEditorProps = {
  dispatch: (action: EvaluationPlanEditorAction) => void;
  issues?: ValidationIssue[];
  plan: EvaluationPlan;
};

function issueFor(issues: ValidationIssue[], path: string) {
  return issues.find((issue) => issue.path === path)?.message;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

export function EvaluationPlanEditor({
  dispatch,
  issues = [],
  plan,
}: EvaluationPlanEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.025em]">Evaluation questions</h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
            Review every question before saving. Importance affects deterministic
            scoring and is not sent to Jev.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Fixed weights: Required ×3, Core ×2, Preferred ×1.
          </p>
        </div>
        <Button
          className="self-start"
          onClick={() =>
            dispatch({ type: "add-question", question: newQuestion() })
          }
          type="button"
          variant="outline"
        >
          <PlusIcon data-icon="inline-start" />
          Add question
        </Button>
      </div>

      <FieldError message={issueFor(issues, "questions")} />

      <div className="overflow-hidden rounded-[12px] border bg-surface">
        {plan.questions.map((question, questionIndex) => (
          <QuestionEditor
            dispatch={dispatch}
            issues={issues}
            key={`${question.id}-${questionIndex}`}
            question={question}
            questionIndex={questionIndex}
          />
        ))}
      </div>
    </div>
  );
}

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

type QuestionEditorProps = {
  dispatch: (action: EvaluationPlanEditorAction) => void;
  issues: ValidationIssue[];
  question: EvaluationQuestion;
  questionIndex: number;
};

function QuestionEditor({
  dispatch,
  issues,
  question,
  questionIndex,
}: QuestionEditorProps) {
  const [draggedCriterionIndex, setDraggedCriterionIndex] = useState<number | null>(null);
  const [dropCriterionIndex, setDropCriterionIndex] = useState<number | null>(null);
  const path = `questions[${questionIndex}]`;
  const idError = issueFor(issues, `${path}.id`);
  const instructionsError = issueFor(issues, `${path}.jev.instructions`);
  const criteriaError = issueFor(issues, `${path}.jev.criteria`);
  const scoreCriteria =
    question.jev.type === "score" ? question.jev.criteria : null;

  return (
    <article className="space-y-4 border-b p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Question {questionIndex + 1}</p>
        <Button
          onClick={() => dispatch({ type: "delete-question", questionIndex })}
          size="sm"
          type="button"
          variant="destructive"
        >
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      </div>

      <label className="block text-sm font-medium">
        Question ID
        <Input
          aria-invalid={Boolean(idError)}
          className="mt-2 h-10 rounded-xl"
          onChange={(event) =>
            dispatch({
              type: "set-question-id",
              questionIndex,
              id: event.target.value,
            })
          }
          value={question.id}
        />
        <FieldError message={idError} />
      </label>

      <label className="block text-sm font-medium">
        Instructions
        <textarea
          aria-invalid={Boolean(instructionsError)}
          className="mt-2 min-h-24 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) =>
            dispatch({
              type: "set-question-instructions",
              questionIndex,
              instructions: event.target.value,
            })
          }
          value={question.jev.instructions}
        />
        <FieldError message={instructionsError} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Importance
          <select
            className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Type
          <select
            className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

      {scoreCriteria ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Criteria, weakest to strongest</p>
          {scoreCriteria.map((criterion, criterionIndex) => {
            const criterionError = issueFor(
              issues,
              `${path}.jev.criteria[${criterionIndex}]`,
            );
            return (
              <div
                className={
                  dropCriterionIndex === criterionIndex
                    ? "rounded-xl bg-primary-soft p-2"
                    : "rounded-xl p-2"
                }
                key={criterionIndex}
                onDragOver={(event) => {
                  if (
                    draggedCriterionIndex === null ||
                    draggedCriterionIndex === criterionIndex
                  ) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropCriterionIndex(criterionIndex);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedCriterionIndex !== null) {
                    dispatch({
                      type: "reorder-criterion",
                      questionIndex,
                      sourceIndex: draggedCriterionIndex,
                      targetIndex: criterionIndex,
                    });
                  }
                  setDraggedCriterionIndex(null);
                  setDropCriterionIndex(null);
                }}
              >
                <div className="flex items-center gap-2">
                  <button
                    aria-label={`Drag criterion ${criterionIndex + 1}`}
                    className="cursor-grab rounded-lg p-2 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                    draggable
                    onDragEnd={() => {
                      setDraggedCriterionIndex(null);
                      setDropCriterionIndex(null);
                    }}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData(
                        "text/plain",
                        String(criterionIndex),
                      );
                      setDraggedCriterionIndex(criterionIndex);
                    }}
                    title="Drag to reorder"
                    type="button"
                  >
                    <GripVerticalIcon className="size-4" />
                  </button>
                  <Input
                    aria-invalid={Boolean(criterionError)}
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
                    <Trash2Icon aria-hidden="true" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
                <FieldError message={criterionError} />
              </div>
            );
          })}
          <FieldError message={criteriaError} />
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
            <PlusIcon data-icon="inline-start" />
            Add criterion
          </Button>
        </div>
      ) : null}
    </article>
  );
}
