import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EvaluationPlanGenerationError,
  generateEvaluationPlan,
  getLlmClientOptions,
  getLlmConfiguration,
  validateGeneratedEvaluationPlan,
} from "./generate-evaluation-plan";

const validPlan = {
  questions: [
    {
      id: "typescript_depth",
      importance: "core",
      jev: {
        type: "score",
        instructions: "Rate the TypeScript depth demonstrated by resume.",
        criteria: ["No relevant experience", "Production ownership"],
      },
    },
  ],
};

function clientReturning(content: string | null) {
  return {
    chat: { completions: { create: async () => ({ choices: [{ message: { content } }] }) } },
  };
}

const testConfiguration = { apiKey: "key", model: "test-model" };

describe("LLM Evaluation Plan generation", () => {
  it("omits an empty base URL and trims a configured one", () => {
    expect(
      getLlmConfiguration({ LLM_API_KEY: " key ", LLM_BASE_URL: "  ", LLM_MODEL: " model " }),
    ).toEqual({ apiKey: "key", model: "model" });
    expect(
      getLlmConfiguration({
        LLM_API_KEY: "key",
        LLM_BASE_URL: " https://llm.example/v1/ ",
        LLM_MODEL: "model",
      }),
    ).toEqual({ apiKey: "key", baseURL: "https://llm.example/v1/", model: "model" });
    expect(getLlmClientOptions({ apiKey: "key", model: "model" })).toEqual({ apiKey: "key" });
    expect(
      getLlmClientOptions({ apiKey: "key", baseURL: "https://llm.example/v1/", model: "model" }),
    ).toEqual({ apiKey: "key", baseURL: "https://llm.example/v1/" });
  });

  it("rejects malformed provider output", async () => {
    await expect(
      generateEvaluationPlan("A job description", {
        client: clientReturning("not json"),
        configuration: testConfiguration,
      }),
    ).rejects.toBeInstanceOf(EvaluationPlanGenerationError);
  });

  it("rejects protected attributes and scoring metadata", () => {
    expect(
      validateGeneratedEvaluationPlan({
        ...validPlan,
        questions: [
          { ...validPlan.questions[0], weight: 3 },
          {
            ...validPlan.questions[0],
            id: "age",
            jev: { type: "noul", instructions: "Does resume show the candidate's age?" },
          },
        ],
      }),
    ).toMatchObject({ success: false });
  });

  it("returns a validated provider plan", async () => {
    await expect(
      generateEvaluationPlan("A job description", {
        client: clientReturning(JSON.stringify(validPlan)),
        configuration: testConfiguration,
      }),
    ).resolves.toEqual(validPlan);
  });

  it("normalizes common provider criteria objects and sibling instructions", async () => {
    const providerPlan = {
      questions: [{
        id: "typescript_depth",
        importance: "core",
        instructions: "Rate the TypeScript depth demonstrated by resume.",
        jev: {
          type: "score",
          criteria: [{ description: "No evidence" }, { description: "Production ownership" }],
        },
      }],
    };

    await expect(generateEvaluationPlan("A job description", {
      client: clientReturning(JSON.stringify(providerPlan)),
      configuration: testConfiguration,
    })).resolves.toEqual({
      questions: [{
        id: "typescript_depth",
        importance: "core",
        jev: {
          type: "score",
          instructions: "Rate the TypeScript depth demonstrated by resume.",
          criteria: ["No evidence", "Production ownership"],
        },
      }],
    });
  });

  it("accepts fenced JSON with case-insensitive provider labels", async () => {
    const providerPlan = {
      questions: [{
        id: "typescript_depth",
        importance: "Core",
        question: "Rate the TypeScript depth demonstrated by resume.",
        jev: { type: "Score", criteria: [{ label: "No evidence" }, { text: "Production ownership" }] },
      }],
    };
    await expect(generateEvaluationPlan("A job description", {
      client: clientReturning(`\`\`\`json\n${JSON.stringify(providerPlan)}\n\`\`\``),
      configuration: testConfiguration,
    })).resolves.toEqual({
      questions: [{ id: "typescript_depth", importance: "core", jev: { type: "score", instructions: "Rate the TypeScript depth demonstrated by resume.", criteria: ["No evidence", "Production ownership"] } }],
    });
  });

  it("normalizes criteria nested under a provider object", async () => {
    const providerPlan = {
      questions: [{
        id: "typescript_depth",
        importance: "core",
        jev: {
          type: "score",
          instructions: "Rate the TypeScript depth demonstrated by resume.",
          criteria: { levels: [{ description: "No evidence" }, { description: "Production ownership" }] },
        },
      }],
    };
    await expect(generateEvaluationPlan("A job description", {
      client: clientReturning(JSON.stringify(providerPlan)),
      configuration: testConfiguration,
    })).resolves.toEqual({
      questions: [{ id: "typescript_depth", importance: "core", jev: { type: "score", instructions: "Rate the TypeScript depth demonstrated by resume.", criteria: ["No evidence", "Production ownership"] } }],
    });
  });
});
