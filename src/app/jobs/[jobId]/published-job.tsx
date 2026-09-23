"use client";

import { useRef, useState } from "react";
import { ExternalLinkIcon, FileTextIcon, LoaderCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  applicationReviewStatus,
  type ApplicationReviewStatus,
} from "@/lib/domain/application-review";
import { type EvaluationQuestion, validateEvaluationPlan } from "@/lib/domain/evaluation-plan";
import { readApplicationEvaluations } from "@/lib/domain/application-review";
import type { EvaluationResult } from "@/lib/domain/models";

export type PublishedApplication = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  match_score: number | null;
  status: "processing" | "evaluated" | "failed";
  created_at: string;
  first_viewed_at: string | null;
  reviewed_at: string | null;
  evidenceCount: number;
  totalCriteria: number;
};

type ApplicationDetail = Omit<PublishedApplication, "evidenceCount"> & {
  evaluations: unknown;
};

type JobContext = {
  title: string | null;
  evaluation_plan: unknown;
};

type PublishedJobProps = {
  status: "published" | "closed";
  applications: PublishedApplication[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function reviewLabel(status: ApplicationReviewStatus) {
  if (status === "in_review") return "In review";
  return status === "reviewed" ? "Reviewed" : "New";
}

function reviewTone(status: ApplicationReviewStatus) {
  if (status === "reviewed") return "bg-success-soft text-success";
  if (status === "in_review") return "bg-warning-soft text-warning";
  return "bg-primary-soft text-primary";
}

function processingLabel(status: PublishedApplication["status"]) {
  if (status === "evaluated") return "Evaluated";
  if (status === "processing") return "Processing";
  return "Evaluation unavailable";
}

export function PublishedJob({ status, applications }: PublishedJobProps) {
  const selectionRequest = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localReviewDates, setLocalReviewDates] = useState<Record<string, { first: string | null; reviewed: string | null }>>({});

  function getReviewStatus(application: PublishedApplication) {
    const dates = localReviewDates[application.id];
    return applicationReviewStatus({
      first_viewed_at: dates?.first ?? application.first_viewed_at,
      reviewed_at: dates?.reviewed ?? application.reviewed_at,
    });
  }

  async function selectApplication(application: PublishedApplication) {
    const requestVersion = ++selectionRequest.current;
    setSelectedId(application.id);
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/applications/${application.id}/review`, {
        body: JSON.stringify({ action: "open" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const body = await response.json() as {
        application?: ApplicationDetail;
        job?: JobContext;
        error?: string;
      };
      if (requestVersion !== selectionRequest.current) return;
      if (!response.ok || !body.application || !body.job) {
        setError(body.error ?? "We could not open this application.");
        setDetail(null);
        return;
      }
      setDetail(body.application);
      setJobContext(body.job);
      setLocalReviewDates((previous) => ({
        ...previous,
        [application.id]: {
          first: body.application!.first_viewed_at,
          reviewed: body.application!.reviewed_at,
        },
      }));
    } catch {
      if (requestVersion === selectionRequest.current) {
        setError("We could not open this application. Check your connection and try again.");
        setDetail(null);
      }
    } finally {
      if (requestVersion === selectionRequest.current) setIsLoading(false);
    }
  }

  async function markReviewed() {
    if (!detail) return;
    setError(null);
    setIsMarkingReviewed(true);
    try {
      const response = await fetch(`/api/applications/${detail.id}/review`, {
        body: JSON.stringify({ action: "mark-reviewed" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const body = await response.json() as { application?: ApplicationDetail; error?: string };
      if (!response.ok || !body.application) {
        setError(body.error ?? "We could not mark this application reviewed.");
        return;
      }
      setDetail(body.application);
      setLocalReviewDates((previous) => ({
        ...previous,
        [body.application!.id]: {
          first: body.application!.first_viewed_at,
          reviewed: body.application!.reviewed_at,
        },
      }));
    } catch {
      setError("We could not mark this application reviewed. Check your connection and try again.");
    } finally {
      setIsMarkingReviewed(false);
    }
  }

  const validatedPlan = jobContext ? validateEvaluationPlan(jobContext.evaluation_plan) : null;
  const evaluations = detail && validatedPlan?.success
    ? readApplicationEvaluations(validatedPlan.data, detail.evaluations)
    : null;
  const totalWeight = evaluations?.reduce((sum, item) => sum + item.weight, 0) ?? 0;
  const currentStatus = detail ? applicationReviewStatus(detail) : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {status === "closed" ? (
        <p className="shrink-0 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
          This Job is closed. New candidate submissions are disabled; existing applications remain available for review.
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(5rem,0.8fr)_minmax(8rem,1.2fr)] items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.78fr)] xl:grid-rows-1 xl:gap-4">
        <section aria-label="Applications" className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-surface">
          {applications.length ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="h-11 border-b text-xs text-muted-foreground">
                    <th className="px-5 font-medium">Candidate</th>
                    <th className="px-3 font-medium">Match score</th>
                    <th className="px-3 font-medium">Criteria evidence</th>
                    <th className="px-3 font-medium">Applied</th>
                    <th className="px-4 font-medium">Review status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => {
                    const reviewStatus = getReviewStatus(application);
                    const isSelected = selectedId === application.id;
                    const score = application.match_score === null ? null : Math.round(application.match_score);
                    return (
                      <tr
                        aria-selected={isSelected}
                        className={`cursor-pointer border-b last:border-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring ${isSelected ? "bg-primary-soft/50 outline outline-1 -outline-offset-1 outline-primary" : "hover:bg-muted/40"}`}
                        onClick={() => void selectApplication(application)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            void selectApplication(application);
                          }
                        }}
                        key={application.id}
                        tabIndex={0}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                              {application.candidate_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <span className="block truncate font-medium text-foreground">{application.candidate_name}</span>
                              <span className="mt-1 block truncate text-xs text-muted-foreground">{application.candidate_email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-semibold tabular-nums">{score === null ? "—" : score}</div>
                          <div aria-hidden="true" className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${score ?? 0}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className="font-medium tabular-nums">{application.evidenceCount && application.totalCriteria ? `${application.evidenceCount}/${application.totalCriteria}` : "—"}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{processingLabel(application.status)}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">{formatDate(application.created_at)}</td>
                        <td className="px-4 py-4">
                          <Badge className={reviewTone(reviewStatus)} variant="neutral">{reviewLabel(reviewStatus)}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-7 text-sm text-muted-foreground">No applications have been submitted yet.</p>
          )}
        </section>

        <aside aria-label="Selected application" aria-live="polite" className="min-h-0 overflow-y-auto rounded-xl border bg-surface p-5 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-60 items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" /> Loading application…
            </div>
          ) : detail && jobContext ? (
            <>
              <header className="flex items-start justify-between gap-4 border-b pb-5">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Candidate application</p>
                  <h2 className="mt-2 truncate text-xl font-semibold tracking-[-0.025em]">{detail.candidate_name}</h2>
                  <a className="mt-1 block truncate text-sm text-muted-foreground hover:text-primary" href={`mailto:${detail.candidate_email}`}>{detail.candidate_email}</a>
                  <p className="mt-2 text-xs text-muted-foreground">Applied {formatDate(detail.created_at)} · {processingLabel(detail.status)}</p>
                </div>
                {currentStatus ? <Badge className={reviewTone(currentStatus)} variant="neutral">{reviewLabel(currentStatus)}</Badge> : null}
              </header>

              <section className="border-b py-5" aria-label="Match score summary">
                <p className="text-sm font-medium">Match score</p>
                <div className="mt-2 flex items-end gap-3">
                  <p className="text-4xl font-semibold tracking-[-0.05em] tabular-nums">{detail.match_score === null ? "—" : Math.round(detail.match_score)}<span className="text-lg font-normal text-muted-foreground"> / 100</span></p>
                </div>
                <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${detail.match_score ?? 0}%` }} />
                </div>
              </section>

              <section className="py-4" aria-labelledby="inspector-evidence-title">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold" id="inspector-evidence-title">Criteria evidence</h3>
                  <span className="text-xs text-muted-foreground">{evaluations?.length ?? 0} / {validatedPlan?.success ? validatedPlan.data.questions.length : 0}</span>
                </div>
                {evaluations?.length && validatedPlan?.success ? (
                  <div className="divide-y pr-1">
                    {evaluations.map((evaluation) => {
                      const question = validatedPlan.data.questions.find((item) => item.id === evaluation.questionId);
                      if (!question) return null;
                      return <EvidenceRow evaluation={evaluation} question={question} totalWeight={totalWeight} key={evaluation.questionId} />;
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-sm text-muted-foreground">
                    {detail.status === "processing" ? "Evaluation is still processing." : "Criterion evidence is unavailable for this application."}
                  </p>
                )}
              </section>

              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                <Button className="flex-1" disabled={currentStatus === "reviewed" || isMarkingReviewed} onClick={() => void markReviewed()} type="button" variant="outline">
                  {isMarkingReviewed ? "Saving…" : currentStatus === "reviewed" ? "Reviewed" : "Mark as reviewed"}
                </Button>
                <Button asChild className="flex-1" variant="default">
                  <a href={`/api/applications/${detail.id}/resume`} rel="noreferrer" target="_blank">
                    <FileTextIcon data-icon="inline-start" /> Open original CV <ExternalLinkIcon aria-hidden="true" className="size-4" />
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex min-h-60 flex-col items-center justify-center text-center">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><FileTextIcon aria-hidden="true" className="size-5" /></span>
              <h2 className="mt-4 font-semibold">Select an application</h2>
              <p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">Candidate details and evidence will appear here. Opening a new application changes its review status to In review.</p>
            </div>
          )}
          {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}

function EvidenceRow({
  evaluation,
  question,
  totalWeight,
}: {
  evaluation: EvaluationResult;
  question: EvaluationQuestion;
  totalWeight: number;
}) {
  const contribution = totalWeight === 0
    ? 0
    : (evaluation.normalizedScore * evaluation.weight / totalWeight) * 100;
  const rawMaximum = question.jev.type === "score"
    ? question.jev.criteria.length - 1
    : 1;

  return (
    <article className="py-3 first:pt-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-medium">{question.id}</h4>
            <Badge variant="outline">{evaluation.type === "score" ? "Score" : "Noul"}</Badge>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{question.jev.instructions}</p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums">{Math.round(evaluation.normalizedScore * 100)}<span className="text-muted-foreground"> / 100</span></p>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div><dt className="text-muted-foreground">Raw</dt><dd className="mt-0.5 font-medium">{evaluation.rawValue} / {rawMaximum}</dd></div>
        <div><dt className="text-muted-foreground">Weight</dt><dd className="mt-0.5 font-medium">{evaluation.weight}</dd></div>
        <div><dt className="text-muted-foreground">Contribution</dt><dd className="mt-0.5 font-medium">{contribution.toFixed(1)} pts</dd></div>
      </dl>
    </article>
  );
}
