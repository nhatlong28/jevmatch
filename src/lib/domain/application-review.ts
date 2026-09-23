import type { EvaluationPlan } from "./evaluation-plan";
import type { EvaluationResult } from "./models";
import { parsePersistedEvaluations } from "./scoring";

export type ApplicationListItem = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  match_score: number | null;
  status: "processing" | "evaluated" | "failed";
  created_at: string;
  first_viewed_at?: string | null;
  reviewed_at?: string | null;
};

export type ApplicationReviewStatus = "new" | "in_review" | "reviewed";

export function applicationReviewStatus(application: {
  first_viewed_at: string | null;
  reviewed_at: string | null;
}): ApplicationReviewStatus {
  if (application.reviewed_at) return "reviewed";
  if (application.first_viewed_at) return "in_review";
  return "new";
}

export function orderApplications<T extends ApplicationListItem>(applications: T[]) {
  return [...applications].sort((left, right) => {
    if (left.match_score === null && right.match_score !== null) return 1;
    if (left.match_score !== null && right.match_score === null) return -1;
    if (left.match_score !== null && right.match_score !== null) {
      const scoreDifference = right.match_score - left.match_score;
      if (scoreDifference !== 0) return scoreDifference;
    }

    return right.created_at.localeCompare(left.created_at);
  });
}

export function readApplicationEvaluations(
  plan: EvaluationPlan,
  value: unknown,
): EvaluationResult[] | null {
  try {
    return parsePersistedEvaluations(plan, value);
  } catch {
    return null;
  }
}
