import "server-only";

import {
  noul,
  score,
  TypeSafeClient,
  type NoulQuestion,
  type ScoreQuestion,
} from "@typesafe-ai/sdk";

import {
  type EvaluationPlan,
  validateEvaluationPlan,
} from "../domain/evaluation-plan";
import { createAdminClient } from "../supabase/admin";
import type { Database } from "../supabase/database.types";

export type JevQuestion = NoulQuestion | ScoreQuestion;
export type JevQuestions = Record<string, JevQuestion>;

export type JevRequest = {
  state: { resume: string };
  questions: JevQuestions;
  model: string;
};

export type JevResponse = {
  answers: Record<string, unknown>;
};

export type JevClient = {
  systemOne(request: JevRequest): Promise<JevResponse>;
};

export type RawJevEvaluation = {
  questionId: string;
  type: "noul" | "score";
  rawValue: number;
  confidence?: number;
};

export type TypeSafeConfiguration = {
  apiKey: string;
  model: string;
};

type TypeSafeEnvironment = {
  TYPESAFE_API_KEY?: string;
  TYPESAFE_DEFAULT_MODEL?: string;
};

export class JevEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JevEvaluationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getTypeSafeConfiguration(
  environment: TypeSafeEnvironment = {
    TYPESAFE_API_KEY: process.env.TYPESAFE_API_KEY,
    TYPESAFE_DEFAULT_MODEL: process.env.TYPESAFE_DEFAULT_MODEL,
  },
): TypeSafeConfiguration {
  const apiKey = environment.TYPESAFE_API_KEY?.trim();
  const model = environment.TYPESAFE_DEFAULT_MODEL?.trim() || "jev-latest";

  if (!apiKey) {
    throw new JevEvaluationError(
      "TypeSafe is not configured. Set TYPESAFE_API_KEY.",
    );
  }

  return { apiKey, model };
}

export function createJevClient(
  configuration: TypeSafeConfiguration = getTypeSafeConfiguration(),
): JevClient {
  return new TypeSafeClient({
    apiKey: configuration.apiKey,
    defaultModel: configuration.model,
    logLevel: "off",
  });
}

export function toJevQuestions(plan: EvaluationPlan): JevQuestions {
  return Object.fromEntries(
    plan.questions.map((question) => {
      if (question.jev.type === "noul") {
        return [question.id, noul(question.jev.instructions)] as const;
      }

      const criteria = question.jev.criteria as [string, string, ...string[]];
      return [question.id, score(question.jev.instructions, criteria)] as const;
    }),
  );
}

export type JevEvaluationValidation =
  | { success: true; data: RawJevEvaluation[] }
  | { success: false; issues: string[] };

export function validateJevAnswers(
  plan: EvaluationPlan,
  answers: unknown,
): JevEvaluationValidation {
  if (!isRecord(answers)) {
    return { success: false, issues: ["Provider answers must be an object."] };
  }

  const expectedIds = new Set(plan.questions.map((question) => question.id));
  const actualIds = Object.keys(answers);
  const issues: string[] = [];

  if (actualIds.length !== expectedIds.size) {
    issues.push("Provider answers must contain every question exactly once.");
  }

  for (const id of actualIds) {
    if (!expectedIds.has(id)) {
      issues.push(`Provider returned an unknown question: ${id}.`);
    }
  }

  const results: RawJevEvaluation[] = [];

  for (const question of plan.questions) {
    const answer = answers[question.id];
    if (!isRecord(answer)) {
      issues.push(`Provider answer is missing for question: ${question.id}.`);
      continue;
    }

    if (answer.type !== question.jev.type) {
      issues.push(`Provider answer type does not match question: ${question.id}.`);
      continue;
    }

    const rawValue = question.jev.type === "noul" ? answer.noul : answer.score;
    if (!isFiniteNumber(rawValue)) {
      issues.push(`Provider answer is not numeric for question: ${question.id}.`);
      continue;
    }

    const maximum = question.jev.type === "noul"
      ? 1
      : question.jev.criteria.length - 1;
    if (rawValue < 0 || rawValue > maximum) {
      issues.push(`Provider answer is out of range for question: ${question.id}.`);
      continue;
    }

    const confidence = answer.confidence;
    if (
      confidence !== undefined
      && (!isFiniteNumber(confidence) || confidence < 0 || confidence > 1)
    ) {
      issues.push(`Provider confidence is invalid for question: ${question.id}.`);
      continue;
    }

    results.push({
      questionId: question.id,
      type: question.jev.type,
      rawValue,
      ...(confidence === undefined ? {} : { confidence }),
    });
  }

  return issues.length > 0 ? { success: false, issues } : { success: true, data: results };
}

type EvaluateResumeDependencies = {
  client?: JevClient;
  configuration?: TypeSafeConfiguration;
};

export async function evaluateResume(
  resumeText: string,
  plan: EvaluationPlan,
  dependencies: EvaluateResumeDependencies = {},
): Promise<RawJevEvaluation[]> {
  const planValidation = validateEvaluationPlan(plan);
  if (!planValidation.success) {
    throw new JevEvaluationError("The published evaluation plan is invalid.");
  }

  const configuration = dependencies.configuration
    ?? (dependencies.client ? { apiKey: "injected", model: "jev-latest" } : getTypeSafeConfiguration());
  const client = dependencies.client ?? createJevClient(configuration);
  const response = await client.systemOne({
    state: { resume: resumeText },
    questions: toJevQuestions(planValidation.data),
    model: configuration.model,
  });
  const validation = validateJevAnswers(planValidation.data, response.answers);

  if (!validation.success) {
    throw new JevEvaluationError("The Jev provider returned invalid evaluation results.");
  }

  return validation.data;
}

type EvaluationOutcome =
  | { status: "evaluated"; evaluations: RawJevEvaluation[] }
  | { status: "failed" };

type AdminClient = ReturnType<typeof createAdminClient>;

async function markApplicationFailed(supabase: AdminClient, applicationId: string) {
  const { error } = await supabase
    .from("applications")
    .update({ evaluations: null, match_score: null, status: "failed" })
    .eq("id", applicationId);

  if (error) throw error;
}

export async function evaluateApplication(
  applicationId: string,
  dependencies: EvaluateResumeDependencies & { adminClient?: AdminClient } = {},
): Promise<EvaluationOutcome> {
  const supabase = dependencies.adminClient ?? createAdminClient();
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, job_id, resume_text, status, evaluations")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) throw applicationError;
  if (!application) throw new JevEvaluationError("Application not found.");

  if (application.status === "evaluated") {
    const existing = application.evaluations;
    if (Array.isArray(existing)) {
      return { status: "evaluated", evaluations: existing as RawJevEvaluation[] };
    }
    throw new JevEvaluationError("Evaluated application has no results.");
  }

  try {
    if (!application.resume_text) throw new JevEvaluationError("Application has no extracted resume text.");

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("status, evaluation_plan")
      .eq("id", application.job_id)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job || job.status === "draft") throw new JevEvaluationError("Application has no immutable evaluation plan.");

    const planValidation = validateEvaluationPlan(job.evaluation_plan);
    if (!planValidation.success) throw new JevEvaluationError("The published evaluation plan is invalid.");

    const evaluations = await evaluateResume(application.resume_text, planValidation.data, dependencies);
    const update: Database["public"]["Tables"]["applications"]["Update"] = {
      evaluations: evaluations as unknown as Database["public"]["Tables"]["applications"]["Update"]["evaluations"],
      match_score: null,
      status: "evaluated",
    };
    const { error: updateError } = await supabase
      .from("applications")
      .update(update)
      .eq("id", applicationId);

    if (updateError) throw updateError;
    return { status: "evaluated", evaluations };
  } catch (error) {
    await markApplicationFailed(supabase, applicationId);
    if (error instanceof JevEvaluationError) return { status: "failed" };
    return { status: "failed" };
  }
}
