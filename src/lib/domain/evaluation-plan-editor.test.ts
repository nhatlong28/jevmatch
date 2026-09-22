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
  it("sets a generated or loaded plan", () => {
    expect(
      evaluationPlanEditorReducer(null, { type: "set-plan", plan }),
    ).toEqual(plan);
  });

  it("adds and deletes a question", () => {
    const question = {
      id: "communication",
      importance: "preferred" as const,
      jev: { type: "noul" as const, instructions: "Is communication clear?" },
    };
    const added = evaluationPlanEditorReducer(plan, {
      type: "add-question",
      question,
    });

    expect(added?.questions).toHaveLength(2);
    expect(
      evaluationPlanEditorReducer(added, {
        type: "delete-question",
        questionIndex: 0,
      })?.questions,
    ).toEqual([question]);
  });

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

  it("edits instructions and importance", () => {
    const withInstructions = evaluationPlanEditorReducer(plan, {
      type: "set-question-instructions",
      questionIndex: 0,
      instructions: "Updated instructions",
    });
    const next = evaluationPlanEditorReducer(withInstructions, {
      type: "set-question-importance",
      questionIndex: 0,
      importance: "required",
    });

    expect(next?.questions[0]).toMatchObject({
      importance: "required",
      jev: { instructions: "Updated instructions" },
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

  it("reorders score criteria by source and target index", () => {
    const next = evaluationPlanEditorReducer(plan, {
      type: "reorder-criterion",
      questionIndex: 0,
      sourceIndex: 2,
      targetIndex: 0,
    });

    expect(next?.questions[0].jev).toEqual({
      ...plan.questions[0].jev,
      criteria: ["Strong evidence", "No evidence", "Some evidence"],
    });
  });

  it("ignores a criterion reorder outside the list boundary", () => {
    expect(
      evaluationPlanEditorReducer(plan, {
        type: "reorder-criterion",
        questionIndex: 0,
        sourceIndex: 3,
        targetIndex: 0,
      }),
    ).toEqual(plan);
  });

  it("ignores criterion actions for a noul question", () => {
    const noulPlan: EvaluationPlan = {
      questions: [
        {
          id: "work_authorization",
          importance: "required",
          jev: { type: "noul", instructions: "Is authorization shown?" },
        },
      ],
    };

    expect(
      evaluationPlanEditorReducer(noulPlan, {
        type: "add-criterion",
        questionIndex: 0,
      }),
    ).toEqual(noulPlan);
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
