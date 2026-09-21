import "server-only";

import OpenAI from "openai";

import {
  type EvaluationPlan,
  type EvaluationPlanValidation,
  validateEvaluationPlan,
} from "../domain/evaluation-plan";

type LlmConfiguration = {
  apiKey: string;
  baseURL?: string;
  model: string;
};

type LlmEnvironment = {
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
};

type CompletionClient = {
  chat: {
    completions: {
      create: (request: {
        model: string;
        messages: { content: string; role: "system" | "user" }[];
        response_format: { type: "json_object" };
      }) => Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
};

export class EvaluationPlanGenerationError extends Error {}

export function getLlmConfiguration(
  environment: LlmEnvironment = {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL,
    LLM_MODEL: process.env.LLM_MODEL,
  },
): LlmConfiguration {
  const apiKey = environment.LLM_API_KEY?.trim();
  const model = environment.LLM_MODEL?.trim();
  const baseURL = environment.LLM_BASE_URL?.trim();

  if (!apiKey || !model) {
    throw new EvaluationPlanGenerationError(
      "LLM is not configured. Set LLM_API_KEY and LLM_MODEL.",
    );
  }

  return { apiKey, ...(baseURL ? { baseURL } : {}), model };
}

export function createLlmClient(configuration: LlmConfiguration): CompletionClient {
  return new OpenAI(getLlmClientOptions(configuration));
}

export function getLlmClientOptions(configuration: LlmConfiguration) {
  return {
    apiKey: configuration.apiKey,
    ...(configuration.baseURL ? { baseURL: configuration.baseURL } : {}),
  };
}

const generationInstructions = `Return only one JSON object with a non-empty \"questions\" array for an Evaluation Plan.
Generate at least six self-contained questions that evaluate only job-related qualifications from the supplied job description. Never return an empty questions array.
Every question must have a unique stable snake_case id, importance of required, core, or preferred, and a jev object.
Use only noul for clear yes/no requirements and score for partial satisfaction, depth, scope, ownership, proficiency, relevance, or transferability.
Every instruction must refer to \"resume\" and include explicit job thresholds when present.
Score criteria must contain at least two non-empty strings ordered from weakest to strongest match.
Never use choice, numeric weights, Match Score, hiring decisions, or protected/personal attributes.
Use this shape: {\"questions\":[{\"id\":\"job_requirement\",\"importance\":\"core\",\"jev\":{\"type\":\"noul\",\"instructions\":\"Does resume demonstrate the job-related requirement?\"}}]}.`;

const prohibitedInstructionPattern =
  /\b(age|gender|sex|race|religion|disability|ethnicity|nationality|marital status|pregnan(?:t|cy)|sexual orientation|hire|reject)\b/i;
const prohibitedKeys = new Set([
  "choice",
  "hiringdecision",
  "matchscore",
  "numericweight",
  "weight",
]);

function normalizedKey(key: string) {
  return key.replaceAll(/[_-]/g, "").toLowerCase();
}

function hasProhibitedContent(value: unknown): boolean {
  if (typeof value === "string") return prohibitedInstructionPattern.test(value);
  if (Array.isArray(value)) return value.some(hasProhibitedContent);
  if (!value || typeof value !== "object") return false;

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      prohibitedKeys.has(normalizedKey(key)) ||
      hasProhibitedContent(nestedValue),
  );
}

function normalizeGeneratedPlan(value: unknown): unknown {
  if (!value || typeof value !== "object" || !Array.isArray((value as { questions?: unknown }).questions)) {
    return value;
  }

  return {
    questions: (value as { questions: unknown[] }).questions.map((candidate) => {
      if (!candidate || typeof candidate !== "object") return candidate;
      const question = candidate as Record<string, unknown>;
      const sourceJev = question.jev && typeof question.jev === "object"
        ? question.jev as Record<string, unknown>
        : {};
      const type = typeof sourceJev.type === "string" ? sourceJev.type.toLowerCase() : sourceJev.type;
      const instructions = sourceJev.instructions ?? question.instructions ?? question.question;
      const rawCriteria = sourceJev.criteria ?? question.criteria;
      const criteriaSource = Array.isArray(rawCriteria)
        ? rawCriteria
        : rawCriteria && typeof rawCriteria === "object"
          ? Object.values(rawCriteria as Record<string, unknown>).find(Array.isArray)
            ?? Object.values(rawCriteria as Record<string, unknown>)
          : rawCriteria;
      const criteria = Array.isArray(criteriaSource)
        ? criteriaSource.map((criterion) =>
            criterion && typeof criterion === "object"
              ? (criterion as { description?: unknown; label?: unknown; text?: unknown }).description
                ?? (criterion as { label?: unknown }).label
                ?? (criterion as { text?: unknown }).text
              : criterion,
          )
        : criteriaSource;

      return {
        id: question.id,
        importance: typeof question.importance === "string" ? question.importance.toLowerCase() : question.importance,
        jev: type === "score"
          ? { type, instructions, criteria }
          : { type, instructions },
      };
    }),
  };
}

function parseProviderJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    const object = fenced ?? content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
    if (!object) throw new EvaluationPlanGenerationError("The LLM returned an invalid evaluation plan.");
    try {
      return JSON.parse(object);
    } catch {
      throw new EvaluationPlanGenerationError("The LLM returned an invalid evaluation plan.");
    }
  }
}

export function validateGeneratedEvaluationPlan(value: unknown): EvaluationPlanValidation {
  const validation = validateEvaluationPlan(value);
  if (!validation.success) return validation;

  if (hasProhibitedContent(value)) {
    return {
      success: false,
      issues: [
        {
          path: "questions",
          message:
            "Generated plans cannot include protected attributes, hiring decisions, or scoring metadata.",
        },
      ],
    };
  }

  return validation;
}

type GenerationDependencies = {
  client?: CompletionClient;
  configuration?: LlmConfiguration;
};

export async function generateEvaluationPlan(
  jdText: string,
  dependencies: GenerationDependencies = {},
): Promise<EvaluationPlan> {
  const configuration = dependencies.configuration ?? getLlmConfiguration();
  const client = dependencies.client ?? createLlmClient(configuration);
  const completion = await client.chat.completions.create({
    model: configuration.model,
    messages: [
      { content: generationInstructions, role: "system" },
      { content: jdText, role: "user" },
    ],
    response_format: { type: "json_object" },
  });
  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new EvaluationPlanGenerationError("The LLM returned no evaluation plan.");
  }

  const candidate = parseProviderJson(content);

  const validation = validateGeneratedEvaluationPlan(normalizeGeneratedPlan(candidate));
  if (!validation.success) {
    throw new EvaluationPlanGenerationError(
      "The LLM returned an invalid evaluation plan.",
    );
  }

  return validation.data;
}
