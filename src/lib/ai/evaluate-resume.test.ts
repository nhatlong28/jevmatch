import { describe, expect, it, vi } from "vitest";
import { TypeSafeClient } from "@typesafe-ai/sdk";

vi.mock("server-only", () => ({}));

import {
  type JevClient,
  evaluateApplication,
  evaluateResume,
  getTypeSafeConfiguration,
  toJevQuestions,
  validateJevAnswers,
} from "./evaluate-resume";
import type { EvaluationPlan } from "../domain/evaluation-plan";

const plan: EvaluationPlan = {
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
      importance: "preferred",
      jev: {
        type: "score",
        instructions: "Rate the TypeScript depth shown by the resume.",
        criteria: ["No evidence", "Production ownership", "Technical leadership"],
      },
    },
  ],
};

describe("Jev resume evaluation", () => {
  it("uses only self-contained primitives and preserves Score ordering", () => {
    expect(toJevQuestions(plan)).toEqual({
      minimum_experience: {
        type: "noul",
        instructions: "Does the resume show at least five years of experience?",
      },
      typescript_depth: {
        type: "score",
        instructions: "Rate the TypeScript depth shown by the resume.",
        criteria: ["No evidence", "Production ownership", "Technical leadership"],
      },
    });
  });

  it("sends exactly the resume state and plan-derived questions", async () => {
    let request: Parameters<JevClient["systemOne"]>[0] | undefined;
    const client: JevClient = {
      systemOne: async (receivedRequest) => {
        request = receivedRequest;
        return {
          answers: {
            minimum_experience: { type: "noul", noul: 1 },
            typescript_depth: { type: "score", score: 2, confidence: 0.9 },
          },
        };
      },
    };

    await evaluateResume("Private resume text", plan, {
      client,
      configuration: { apiKey: "test-key", model: "jev-test" },
    });

    expect(request).toEqual({
      state: { resume: "Private resume text" },
      questions: toJevQuestions(plan),
      model: "jev-test",
    });
    expect(JSON.stringify(request)).not.toContain("required");
    expect(JSON.stringify(request)).not.toContain("preferred");
  });

  it("rejects missing, duplicate/extra, mismatched, and out-of-range answers", () => {
    expect(validateJevAnswers(plan, {
      minimum_experience: { type: "noul", noul: 0.5 },
    }).success).toBe(false);

    expect(validateJevAnswers(plan, {
      minimum_experience: { type: "score", score: 0 },
      typescript_depth: { type: "score", score: 1 },
      extra: { type: "noul", noul: 0 },
    }).success).toBe(false);

    expect(validateJevAnswers(plan, {
      minimum_experience: { type: "noul", noul: 1.1 },
      typescript_depth: { type: "score", score: 1 },
    }).success).toBe(false);
  });

  it("returns raw values in plan order after validating the provider contract", async () => {
    const client: JevClient = {
      systemOne: async () => ({
        answers: {
          typescript_depth: { type: "score", score: 1.5, confidence: 0.75 },
          minimum_experience: { type: "noul", noul: 0.8 },
        },
      }),
    };

    await expect(evaluateResume("Resume", plan, {
      client,
      configuration: { apiKey: "test-key", model: "jev-test" },
    })).resolves.toEqual([
      { questionId: "minimum_experience", type: "noul", rawValue: 0.8 },
      { questionId: "typescript_depth", type: "score", rawValue: 1.5, confidence: 0.75 },
    ]);
  });

  it("validates a response fixture through the installed TypeSafe SDK", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const sdkClient = new TypeSafeClient({
      apiKey: "test-key",
      defaultModel: "jev-fixture",
      logLevel: "off",
      fetch: async (_input, init) => {
        requestBody = JSON.parse(String(init?.body));
        return Response.json({
          model: "jev-fixture",
          answers: {
            minimum_experience: { type: "noul", noul: 0.7 },
            typescript_depth: {
              type: "score",
              score: 1.25,
              confidence: 0.8,
              legend: { "0": "No evidence", "1": "Production ownership", "2": "Technical leadership" },
              probabilities: { "0": 0.1, "1": 0.5, "2": 0.4 },
            },
          },
          usage: { input_tokens: 1, output_tokens: 1 },
        });
      },
    });

    await expect(evaluateResume("Fixture resume", plan, {
      client: sdkClient as unknown as JevClient,
      configuration: { apiKey: "test-key", model: "jev-fixture" },
    })).resolves.toEqual([
      { questionId: "minimum_experience", type: "noul", rawValue: 0.7 },
      { questionId: "typescript_depth", type: "score", rawValue: 1.25, confidence: 0.8 },
    ]);
    expect(requestBody).toMatchObject({
      model: "jev-fixture",
      state: { resume: "Fixture resume" },
    });
    expect(requestBody).not.toHaveProperty("state.jdText");
  });

  it("rejects invalid provider output before it can be persisted", async () => {
    const client: JevClient = {
      systemOne: async () => ({
        answers: {
          minimum_experience: { type: "noul", noul: Number.NaN },
          typescript_depth: { type: "score", score: 1 },
        },
      }),
    };

    await expect(evaluateResume("Resume", plan, {
      client,
      configuration: { apiKey: "test-key", model: "jev-test" },
    })).rejects.toThrow("invalid evaluation results");
  });

  it("uses the documented default model and requires the server key", () => {
    expect(getTypeSafeConfiguration({ TYPESAFE_API_KEY: " key " })).toEqual({
      apiKey: "key",
      model: "jev-latest",
    });
    expect(() => getTypeSafeConfiguration({ TYPESAFE_API_KEY: " " })).toThrow();
  });

  it("marks a failed application without exposing provider errors", async () => {
    const updates: Record<string, unknown>[] = [];
    let applicationStatus: "processing" | "failed" | "evaluated" = "processing";
    const fakeAdminClient = {
      from(table: string) {
        let operation: "select" | "update" = "select";
        let update: Record<string, unknown> | undefined;

        const builder = {
          select() {
            operation = "select";
            return builder;
          },
          update(values: Record<string, unknown>) {
            operation = "update";
            update = values;
            return builder;
          },
          eq() {
            return builder;
          },
          async maybeSingle() {
            if (table === "applications") {
              return {
                data: {
                  id: "application-1",
                  job_id: "job-1",
                  resume_text: "Resume",
                  status: applicationStatus,
                  evaluations: null,
                },
                error: null,
              };
            }
            return {
              data: { status: "published", evaluation_plan: plan },
              error: null,
            };
          },
          then(resolve: (value: { error: null }) => unknown) {
            if (operation === "update" && update) {
              updates.push(update);
              if (update.status === "failed" || update.status === "evaluated") {
                applicationStatus = update.status;
              }
            }
            return Promise.resolve({ error: null }).then(resolve);
          },
        };
        return builder;
      },
    };
    const client: JevClient = {
      systemOne: async () => {
        throw new Error("provider details must stay private");
      },
    };

    await expect(evaluateApplication("application-1", {
      client,
      configuration: { apiKey: "test-key", model: "jev-test" },
      adminClient: fakeAdminClient as never,
    })).resolves.toEqual({ status: "failed" });
    expect(updates).toContainEqual({ evaluations: null, match_score: null, status: "failed" });

    const retryClient: JevClient = {
      systemOne: async () => ({
        answers: {
          minimum_experience: { type: "noul", noul: 1 },
          typescript_depth: { type: "score", score: 2 },
        },
      }),
    };
    await expect(evaluateApplication("application-1", {
      client: retryClient,
      configuration: { apiKey: "test-key", model: "jev-test" },
      adminClient: fakeAdminClient as never,
    })).resolves.toMatchObject({ status: "evaluated" });
    expect(updates).toContainEqual({ evaluations: expect.any(Array), match_score: null, status: "evaluated" });
  });
});
