export const IMPORTANCE_VALUES = ["required", "core", "preferred"] as const;

export type Importance = (typeof IMPORTANCE_VALUES)[number];

export type NoulQuestion = {
  id: string;
  importance: Importance;
  jev: {
    type: "noul";
    instructions: string;
  };
};

export type ScoreQuestion = {
  id: string;
  importance: Importance;
  jev: {
    type: "score";
    instructions: string;
    criteria: string[];
  };
};

export type EvaluationQuestion = NoulQuestion | ScoreQuestion;

export type EvaluationPlan = {
  questions: EvaluationQuestion[];
};

export type ValidationIssue = {
  path: string;
  message: string;
};

export type EvaluationPlanValidation =
  | { success: true; data: EvaluationPlan }
  | { success: false; issues: ValidationIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateEvaluationPlan(
  value: unknown,
): EvaluationPlanValidation {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value) || !Array.isArray(value.questions)) {
    return {
      success: false,
      issues: [{ path: "questions", message: "Questions must be an array." }],
    };
  }

  if (value.questions.length === 0) {
    issues.push({
      path: "questions",
      message: "An evaluation plan must contain at least one question.",
    });
  }

  const ids = new Set<string>();

  value.questions.forEach((question, index) => {
    const path = `questions[${index}]`;

    if (!isRecord(question)) {
      issues.push({ path, message: "Question must be an object." });
      return;
    }

    if (!isNonEmptyString(question.id)) {
      issues.push({ path: `${path}.id`, message: "ID must not be empty." });
    } else if (ids.has(question.id)) {
      issues.push({ path: `${path}.id`, message: "ID must be unique." });
    } else {
      ids.add(question.id);
    }

    if (
      typeof question.importance !== "string" ||
      !IMPORTANCE_VALUES.includes(question.importance as Importance)
    ) {
      issues.push({
        path: `${path}.importance`,
        message: "Importance must be required, core, or preferred.",
      });
    }

    if (!isRecord(question.jev)) {
      issues.push({ path: `${path}.jev`, message: "Jev must be an object." });
      return;
    }

    if (question.jev.type !== "noul" && question.jev.type !== "score") {
      issues.push({
        path: `${path}.jev.type`,
        message: "Jev type must be noul or score.",
      });
      return;
    }

    if (!isNonEmptyString(question.jev.instructions)) {
      issues.push({
        path: `${path}.jev.instructions`,
        message: "Instructions must not be empty.",
      });
    }

    if (question.jev.type === "noul") {
      if ("criteria" in question.jev) {
        issues.push({
          path: `${path}.jev.criteria`,
          message: "Noul questions must not contain criteria.",
        });
      }
      return;
    }

    if (!Array.isArray(question.jev.criteria)) {
      issues.push({
        path: `${path}.jev.criteria`,
        message: "Score criteria must be an array.",
      });
      return;
    }

    if (question.jev.criteria.length < 2) {
      issues.push({
        path: `${path}.jev.criteria`,
        message: "Score questions require at least two criteria.",
      });
    }

    question.jev.criteria.forEach((criterion, criterionIndex) => {
      if (!isNonEmptyString(criterion)) {
        issues.push({
          path: `${path}.jev.criteria[${criterionIndex}]`,
          message: "Criteria must not be empty.",
        });
      }
    });
  });

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return { success: true, data: value as EvaluationPlan };
}

export function isEvaluationPlan(value: unknown): value is EvaluationPlan {
  return validateEvaluationPlan(value).success;
}
