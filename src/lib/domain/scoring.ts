import type { EvaluationPlan, Importance } from "./evaluation-plan";
import { validateEvaluationPlan } from "./evaluation-plan";
import type { EvaluationResult } from "./models";

export const IMPORTANCE_WEIGHTS: Record<Importance, number> = {
  required: 3,
  core: 2,
  preferred: 1,
};

export type ScoringInput = {
  questionId: string;
  type: "noul" | "score";
  rawValue: number;
  confidence?: number;
};

export type ScoringResult = {
  evaluations: EvaluationResult[];
  matchScore: number;
};

export class ScoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScoringError";
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeEvaluation(
  question: EvaluationPlan["questions"][number],
  rawValue: number,
): number {
  if (!isFiniteNumber(rawValue)) {
    throw new ScoringError(`Raw result is not finite: ${question.id}.`);
  }

  if (question.jev.type === "noul") {
    if (rawValue < 0 || rawValue > 1) {
      throw new ScoringError(`Noul result is out of range: ${question.id}.`);
    }
    return rawValue;
  }

  const maxScore = question.jev.criteria.length - 1;
  if (rawValue < 0 || rawValue > maxScore) {
    throw new ScoringError(`Score result is out of range: ${question.id}.`);
  }
  return rawValue / maxScore;
}

export function scoreEvaluations(
  plan: EvaluationPlan,
  results: ScoringInput[],
): ScoringResult {
  const planValidation = validateEvaluationPlan(plan);
  if (!planValidation.success) {
    throw new ScoringError("The evaluation plan is invalid.");
  }

  if (!Array.isArray(results)) {
    throw new ScoringError("Evaluation results must be an array.");
  }

  const questionsById = new Map(
    planValidation.data.questions.map((question) => [question.id, question]),
  );
  if (results.length !== questionsById.size) {
    throw new ScoringError("Evaluation results must contain every question exactly once.");
  }

  const resultsById = new Map<string, ScoringInput>();
  for (const result of results) {
    if (!result || typeof result.questionId !== "string") {
      throw new ScoringError("Evaluation result has an invalid question ID.");
    }
    if (!questionsById.has(result.questionId)) {
      throw new ScoringError(`Evaluation result is unknown: ${result.questionId}.`);
    }
    if (resultsById.has(result.questionId)) {
      throw new ScoringError(`Evaluation result is duplicated: ${result.questionId}.`);
    }
    resultsById.set(result.questionId, result);
  }

  const evaluations = planValidation.data.questions.map((question) => {
    const result = resultsById.get(question.id);
    if (!result) {
      throw new ScoringError(`Evaluation result is missing: ${question.id}.`);
    }
    if (result.type !== question.jev.type) {
      throw new ScoringError(`Evaluation result type does not match: ${question.id}.`);
    }
    if (
      result.confidence !== undefined
      && (!isFiniteNumber(result.confidence) || result.confidence < 0 || result.confidence > 1)
    ) {
      throw new ScoringError(`Evaluation confidence is invalid: ${question.id}.`);
    }

    const normalizedScore = normalizeEvaluation(question, result.rawValue);
    const weight = IMPORTANCE_WEIGHTS[question.importance];
    return {
      questionId: question.id,
      type: question.jev.type,
      importance: question.importance,
      rawValue: result.rawValue,
      normalizedScore,
      weight,
      ...(result.confidence === undefined ? {} : { confidence: result.confidence }),
    } satisfies EvaluationResult;
  });

  const totalWeight = evaluations.reduce((sum, evaluation) => sum + evaluation.weight, 0);
  const weightedSum = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.normalizedScore * evaluation.weight,
    0,
  );

  return {
    evaluations,
    matchScore: (weightedSum / totalWeight) * 100,
  };
}
