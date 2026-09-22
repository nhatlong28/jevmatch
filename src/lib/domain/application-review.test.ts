import { describe, expect, it } from "vitest";

import type { EvaluationPlan } from "./evaluation-plan";
import { orderApplications, readApplicationEvaluations } from "./application-review";

const plan: EvaluationPlan = {
  questions: [
    {
      id: "experience",
      importance: "required",
      jev: { type: "noul", instructions: "Is experience shown?" },
    },
    {
      id: "typescript",
      importance: "preferred",
      jev: {
        type: "score",
        instructions: "How strong is TypeScript evidence?",
        criteria: ["None", "Some", "Strong"],
      },
    },
  ],
};

describe("application review data", () => {
  it("orders evaluated applications by score and leaves unscored records last", () => {
    const applications = [
      { id: "processing", candidate_name: "Processing", candidate_email: "p@example.com", match_score: null, status: "processing" as const, created_at: "2026-09-22T10:00:00Z" },
      { id: "low", candidate_name: "Low", candidate_email: "l@example.com", match_score: 40, status: "evaluated" as const, created_at: "2026-09-22T11:00:00Z" },
      { id: "high", candidate_name: "High", candidate_email: "h@example.com", match_score: 90, status: "evaluated" as const, created_at: "2026-09-22T09:00:00Z" },
      { id: "failed", candidate_name: "Failed", candidate_email: "f@example.com", match_score: null, status: "failed" as const, created_at: "2026-09-22T12:00:00Z" },
    ];

    expect(orderApplications(applications).map((application) => application.id)).toEqual([
      "high",
      "low",
      "failed",
      "processing",
    ]);
  });

  it("rebuilds only valid persisted evaluations from the immutable plan", () => {
    expect(readApplicationEvaluations(plan, [
      { questionId: "experience", type: "noul", importance: "required", rawValue: 1, normalizedScore: 1, weight: 3 },
      { questionId: "typescript", type: "score", importance: "preferred", rawValue: 1, normalizedScore: 0.5, weight: 1, confidence: 0.8 },
    ])).toEqual([
      { questionId: "experience", type: "noul", importance: "required", rawValue: 1, normalizedScore: 1, weight: 3 },
      { questionId: "typescript", type: "score", importance: "preferred", rawValue: 1, normalizedScore: 0.5, weight: 1, confidence: 0.8 },
    ]);
  });

  it("rejects persisted results whose derived fields were tampered with", () => {
    expect(readApplicationEvaluations(plan, [
      { questionId: "experience", type: "noul", importance: "required", rawValue: 1, normalizedScore: 0, weight: 3 },
      { questionId: "typescript", type: "score", importance: "preferred", rawValue: 1, normalizedScore: 0.5, weight: 1 },
    ])).toBeNull();
  });
});
