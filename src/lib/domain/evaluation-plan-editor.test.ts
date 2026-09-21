import { describe, expect, it } from "vitest";

import type { EvaluationPlan } from "./evaluation-plan";
import { evaluationPlanEditorReducer } from "./evaluation-plan-editor";

const plan: EvaluationPlan = {
  questions: [
    {
      id: "typescript_depth",
      importance: "core",
      jev: {
        type: "score",
        instructions: "Rate TypeScript depth demonstrated by resume.",
        criteria: ["No evidence", "Some evidence", "Strong evidence"],
      },
    },
  ],
};

describe("evaluationPlanEditorReducer", () => {
  it("edits a question ID without changing the rest of the question", () => {
    expect(
      evaluationPlanEditorReducer(plan, {
        type: "set-question-id",
        questionIndex: 0,
        id: "frontend_depth",
      })?.questions[0],
    ).toEqual({ ...plan.questions[0], id: "frontend_depth" });
  });

  it("deletes an individual score criterion", () => {
    const next = evaluationPlanEditorReducer(plan, {
      type: "delete-criterion",
      questionIndex: 0,
      criterionIndex: 1,
    });

    expect(next?.questions[0].jev).toEqual({
      ...plan.questions[0].jev,
      criteria: ["No evidence", "Strong evidence"],
    });
  });

  it("adds and edits a score criterion", () => {
    const withEmptyCriterion = evaluationPlanEditorReducer(plan, {
      type: "add-criterion",
      questionIndex: 0,
    });
    const next = evaluationPlanEditorReducer(withEmptyCriterion, {
      type: "set-criterion",
      questionIndex: 0,
      criterionIndex: 3,
      criterion: "Exceptional evidence",
    });

    expect(next?.questions[0].jev).toEqual({
      ...plan.questions[0].jev,
      criteria: [
        "No evidence",
        "Some evidence",
        "Strong evidence",
        "Exceptional evidence",
      ],
    });
  });

  it("removes criteria when changing a score question to noul", () => {
    expect(
      evaluationPlanEditorReducer(plan, {
        type: "set-question-type",
        questionIndex: 0,
        questionType: "noul",
      })?.questions[0].jev,
    ).toEqual({
      type: "noul",
      instructions: "Rate TypeScript depth demonstrated by resume.",
    });
  });

  it("adds default criteria when changing a noul question to score", () => {
    const noulPlan: EvaluationPlan = {
      questions: [
        {
          id: "work_authorization",
          importance: "required",
          jev: {
            type: "noul",
            instructions: "Does resume demonstrate work authorization?",
          },
        },
      ],
    };

    expect(
      evaluationPlanEditorReducer(noulPlan, {
        type: "set-question-type",
        questionIndex: 0,
        questionType: "score",
      })?.questions[0].jev,
    ).toEqual({
      type: "score",
      instructions: "Does resume demonstrate work authorization?",
      criteria: ["No evidence", "Strong evidence"],
    });
  });
});
