import { describe, expect, it } from "vitest";

import type { EvaluationPlan } from "./evaluation-plan";
import {
  IMPORTANCE_WEIGHTS,
  normalizeEvaluation,
  scoreEvaluations,
} from "./scoring";
import type { ScoringInput } from "./scoring";

const plan: EvaluationPlan = {
  questions: [
    {
      id: "required_truth",
      importance: "required",
      jev: { type: "noul", instructions: "Is the required skill present?" },
    },
    {
      id: "core_depth",
      importance: "core",
      jev: {
        type: "score",
        instructions: "Rate the core skill depth.",
        criteria: ["None", "Working", "Strong", "Expert"],
      },
    },
    {
      id: "preferred_signal",
      importance: "preferred",
      jev: {
        type: "score",
        instructions: "Rate the preferred signal.",
        criteria: ["None", "Present"],
      },
    },
  ],
};

describe("deterministic scoring", () => {
  it("uses fixed importance weights and normalizes Noul and Score values", () => {
    const result = scoreEvaluations(plan, [
      { questionId: "preferred_signal", type: "score", rawValue: 0.5 },
      { questionId: "core_depth", type: "score", rawValue: 2, confidence: 0.8 },
      { questionId: "required_truth", type: "noul", rawValue: 0.25 },
    ]);

    expect(IMPORTANCE_WEIGHTS).toEqual({ required: 3, core: 2, preferred: 1 });
    expect(result.evaluations).toEqual([
      {
        questionId: "required_truth",
        type: "noul",
        importance: "required",
        rawValue: 0.25,
        normalizedScore: 0.25,
        weight: 3,
      },
      {
        questionId: "core_depth",
        type: "score",
        importance: "core",
        rawValue: 2,
        normalizedScore: 2 / 3,
        weight: 2,
        confidence: 0.8,
      },
      {
        questionId: "preferred_signal",
        type: "score",
        importance: "preferred",
        rawValue: 0.5,
        normalizedScore: 0.5,
        weight: 1,
      },
    ]);
    expect(result.matchScore).toBeCloseTo((0.25 * 3 + (2 / 3) * 2 + 0.5) / 6 * 100);
  });

  it("handles zero, endpoints, and fractional Score values", () => {
    const scoreQuestion = plan.questions[1];
    expect(normalizeEvaluation(scoreQuestion, 0)).toBe(0);
    expect(normalizeEvaluation(scoreQuestion, 1.5)).toBe(0.5);
    expect(normalizeEvaluation(scoreQuestion, 3)).toBe(1);
    expect(normalizeEvaluation(plan.questions[0], 0)).toBe(0);
    expect(normalizeEvaluation(plan.questions[0], 1)).toBe(1);
  });

  it("is independent of provider result order", () => {
    const first = scoreEvaluations(plan, [
      { questionId: "required_truth", type: "noul", rawValue: 1 },
      { questionId: "core_depth", type: "score", rawValue: 1 },
      { questionId: "preferred_signal", type: "score", rawValue: 0 },
    ]);
    const second = scoreEvaluations(plan, [
      { questionId: "preferred_signal", type: "score", rawValue: 0 },
      { questionId: "required_truth", type: "noul", rawValue: 1 },
      { questionId: "core_depth", type: "score", rawValue: 1 },
    ]);

    expect(second).toEqual(first);
  });

  const invalidCases: Array<[string, ScoringInput[]]> = [
    ["missing", [{ questionId: "required_truth", type: "noul", rawValue: 1 }]],
    ["unknown", [
      { questionId: "required_truth", type: "noul", rawValue: 1 },
      { questionId: "core_depth", type: "score", rawValue: 1 },
      { questionId: "preferred_signal", type: "score", rawValue: 1 },
      { questionId: "other", type: "noul", rawValue: 1 },
    ]],
    ["duplicate", [
      { questionId: "required_truth", type: "noul", rawValue: 1 },
      { questionId: "required_truth", type: "noul", rawValue: 0 },
      { questionId: "core_depth", type: "score", rawValue: 1 },
    ]],
    ["mismatched type", [
      { questionId: "required_truth", type: "score", rawValue: 1 },
      { questionId: "core_depth", type: "score", rawValue: 1 },
      { questionId: "preferred_signal", type: "score", rawValue: 1 },
    ]],
    ["non-finite", [
      { questionId: "required_truth", type: "noul", rawValue: Number.NaN },
      { questionId: "core_depth", type: "score", rawValue: 1 },
      { questionId: "preferred_signal", type: "score", rawValue: 1 },
    ]],
    ["out of range", [
      { questionId: "required_truth", type: "noul", rawValue: 1.1 },
      { questionId: "core_depth", type: "score", rawValue: 1 },
      { questionId: "preferred_signal", type: "score", rawValue: 1 },
    ]],
  ];

  it.each(invalidCases)("rejects %s results", (_label, results) => {
    expect(() => scoreEvaluations(plan, results)).toThrow();
  });

  it("does not let confidence affect the Match Score", () => {
    const withoutConfidence = scoreEvaluations(plan, [
      { questionId: "required_truth", type: "noul", rawValue: 0.5 },
      { questionId: "core_depth", type: "score", rawValue: 2 },
      { questionId: "preferred_signal", type: "score", rawValue: 0.5 },
    ]);
    const withConfidence = scoreEvaluations(plan, [
      { questionId: "required_truth", type: "noul", rawValue: 0.5, confidence: 0 },
      { questionId: "core_depth", type: "score", rawValue: 2, confidence: 1 },
      { questionId: "preferred_signal", type: "score", rawValue: 0.5, confidence: 0.5 },
    ]);

    expect(withConfidence.matchScore).toBe(withoutConfidence.matchScore);
  });
});
