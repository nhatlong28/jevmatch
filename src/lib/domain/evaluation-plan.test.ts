import { describe, expect, it } from "vitest";

import { validateEvaluationPlan } from "./evaluation-plan";

const validPlan = {
  questions: [
    {
      id: "minimum_experience",
      importance: "required",
      jev: {
        type: "noul",
        instructions: "Does the resume show at least five years of experience?",
      },
    },
    {
      id: "typescript_depth",
      importance: "core",
      jev: {
        type: "score",
        instructions: "Rate the demonstrated TypeScript depth.",
        criteria: ["No relevant experience", "Production ownership"],
      },
    },
  ],
} as const;

describe("validateEvaluationPlan", () => {
  it("accepts a valid plan", () => {
    expect(validateEvaluationPlan(validPlan)).toEqual({
      success: true,
      data: validPlan,
    });
  });

  it.each([
    ["invalid type", "questions[0].jev.type", { jev: { type: "choice" } }],
    [
      "invalid importance",
      "questions[0].importance",
      { importance: "critical" },
    ],
    [
      "empty instructions",
      "questions[0].jev.instructions",
      { jev: { type: "noul", instructions: "  " } },
    ],
  ])("rejects %s", (_label, issuePath, change) => {
    const question = validPlan.questions[0];
    const plan = {
      questions: [
        {
          ...question,
          ...change,
          jev: "jev" in change ? change.jev : question.jev,
        },
      ],
    };

    const result = validateEvaluationPlan(plan);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: issuePath })]),
      );
    }
  });

  it("rejects duplicate IDs", () => {
    const result = validateEvaluationPlan({
      questions: [validPlan.questions[0], validPlan.questions[0]],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual({
        path: "questions[1].id",
        message: "ID must be unique.",
      });
    }
  });

  it.each([
    ["fewer than two criteria", ["Only one level"]],
    ["an empty criterion", ["No evidence", "  "]],
  ])("rejects a Score question with %s", (_label, criteria) => {
    const result = validateEvaluationPlan({
      questions: [
        {
          id: "typescript_depth",
          importance: "core",
          jev: {
            type: "score",
            instructions: "Rate TypeScript depth.",
            criteria,
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty plan", () => {
    expect(validateEvaluationPlan({ questions: [] }).success).toBe(false);
  });
});
