import type { EvaluationPlan, Importance } from "./evaluation-plan";
import type { Database } from "../supabase/database.types";

export type JobStatus = Database["public"]["Enums"]["job_status"];

export type ApplicationStatus =
  Database["public"]["Enums"]["application_status"];

export type EvaluationResult = {
  questionId: string;
  type: "score" | "noul";
  importance: Importance;
  rawValue: number;
  normalizedScore: number;
  weight: number;
  confidence?: number;
};

export type Job = {
  id: string;
  recruiterId: string;
  title: string | null;
  jdFilePath: string | null;
  jdText: string | null;
  evaluationPlan: EvaluationPlan | null;
  publicSlug: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type Application = {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  resumeFilePath: string;
  resumeText: string | null;
  matchScore: number | null;
  evaluations: EvaluationResult[] | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};
