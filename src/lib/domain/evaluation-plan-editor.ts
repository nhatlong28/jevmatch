import type {
  EvaluationPlan,
  EvaluationQuestion,
  Importance,
} from "./evaluation-plan";

export type EvaluationPlanEditorAction =
  | { type: "set-plan"; plan: EvaluationPlan }
  | { type: "add-question"; question: EvaluationQuestion }
  | { type: "delete-question"; questionIndex: number }
  | { type: "set-question-id"; questionIndex: number; id: string }
  | { type: "set-question-instructions"; questionIndex: number; instructions: string }
  | { type: "set-question-importance"; questionIndex: number; importance: Importance }
  | { type: "set-question-type"; questionIndex: number; questionType: "noul" | "score" }
  | { type: "set-criterion"; questionIndex: number; criterionIndex: number; criterion: string }
  | { type: "add-criterion"; questionIndex: number }
  | { type: "delete-criterion"; questionIndex: number; criterionIndex: number };

function updateQuestion(
  plan: EvaluationPlan,
  questionIndex: number,
  update: (question: EvaluationQuestion) => EvaluationQuestion,
): EvaluationPlan {
  return {
    questions: plan.questions.map((question, index) =>
      index === questionIndex ? update(question) : question,
    ),
  };
}

export function evaluationPlanEditorReducer(
  plan: EvaluationPlan | null,
  action: EvaluationPlanEditorAction,
): EvaluationPlan | null {
  if (action.type === "set-plan") return action.plan;
  if (!plan) return plan;

  switch (action.type) {
    case "add-question":
      return { questions: [...plan.questions, action.question] };
    case "delete-question":
      return {
        questions: plan.questions.filter(
          (_, index) => index !== action.questionIndex,
        ),
      };
    case "set-question-id":
      return updateQuestion(plan, action.questionIndex, (question) => ({
        ...question,
        id: action.id,
      }));
    case "set-question-instructions":
      return updateQuestion(plan, action.questionIndex, (question) =>
        question.jev.type === "score"
          ? {
              ...question,
              jev: { ...question.jev, instructions: action.instructions },
            }
          : {
              ...question,
              jev: { ...question.jev, instructions: action.instructions },
            },
      );
    case "set-question-importance":
      return updateQuestion(plan, action.questionIndex, (question) => ({
        ...question,
        importance: action.importance,
      }));
    case "set-question-type":
      return updateQuestion(plan, action.questionIndex, (question) =>
        action.questionType === "score"
          ? {
              ...question,
              jev: {
                type: "score",
                instructions: question.jev.instructions,
                criteria:
                  question.jev.type === "score"
                    ? question.jev.criteria
                    : ["No evidence", "Strong evidence"],
              },
            }
          : {
              ...question,
              jev: {
                type: "noul",
                instructions: question.jev.instructions,
              },
            },
      );
    case "set-criterion":
      return updateQuestion(plan, action.questionIndex, (question) =>
        question.jev.type === "score"
          ? {
              ...question,
              jev: {
                ...question.jev,
                criteria: question.jev.criteria.map((criterion, index) =>
                  index === action.criterionIndex ? action.criterion : criterion,
                ),
              },
            }
          : question,
      );
    case "add-criterion":
      return updateQuestion(plan, action.questionIndex, (question) =>
        question.jev.type === "score"
          ? {
              ...question,
              jev: {
                ...question.jev,
                criteria: [...question.jev.criteria, ""],
              },
            }
          : question,
      );
    case "delete-criterion":
      return updateQuestion(plan, action.questionIndex, (question) =>
        question.jev.type === "score"
          ? {
              ...question,
              jev: {
                ...question.jev,
                criteria: question.jev.criteria.filter(
                  (_, index) => index !== action.criterionIndex,
                ),
              },
            }
          : question,
      );
  }
}
