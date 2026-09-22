import { ArrowLeftIcon, ExternalLinkIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { readApplicationEvaluations } from "@/lib/domain/application-review";
import { validateEvaluationPlan } from "@/lib/domain/evaluation-plan";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ jobId: string; applicationId: string }>;
}) {
  if (!(await getCurrentRecruiter())) redirect("/sign-in");

  const { jobId, applicationId } = await params;
  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("id, job_id, candidate_name, candidate_email, match_score, evaluations, status, created_at")
    .eq("id", applicationId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (!application) notFound();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, status, evaluation_plan")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) notFound();

  const planValidation = validateEvaluationPlan(job.evaluation_plan);
  const evaluations = planValidation.success
    ? readApplicationEvaluations(planValidation.data, application.evaluations)
    : null;
  const totalWeight = evaluations?.reduce((sum, evaluation) => sum + evaluation.weight, 0) ?? 0;
  const roundedScore = application.match_score === null ? null : Math.round(application.match_score);

  return (
      <div className="mx-auto max-w-5xl">
        <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`/jobs/${jobId}`}>
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Back to applications
        </Link>

        <header className="mt-7 flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{application.candidate_name}</h1>
              <Badge variant={application.status === "evaluated" ? "success" : "neutral"}>
                {application.status === "evaluated" ? "Evaluated" : application.status === "processing" ? "Processing" : "Evaluation unavailable"}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">{application.candidate_email}</p>
            <p className="mt-1 text-sm text-muted-foreground">Applied {formatDate(application.created_at)} for {job.title ?? "Untitled job"}</p>
          </div>
          <Button asChild variant="outline">
            <a href={`/api/applications/${application.id}/resume`} rel="noreferrer" target="_blank">
              <FileTextIcon data-icon="inline-start" />
              Open original CV
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
            </a>
          </Button>
        </header>

        <section className="mt-8 rounded-[14px] border bg-surface p-5 sm:p-7" aria-labelledby="score-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Neutral evidence summary</p>
              <h2 className="mt-1 text-2xl font-semibold" id="score-title">Match Score</h2>
            </div>
            <div className="min-w-44 text-right">
              <p className="text-4xl font-semibold tracking-[-0.05em] tabular-nums">
                {roundedScore === null ? "—" : `${roundedScore} / 100`}
              </p>
              <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${roundedScore ?? 0}%` }} />
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            This score summarizes evidence against the published evaluation plan. Review the criterion details and original CV together.
          </p>
        </section>

        <section className="mt-6 rounded-[14px] border bg-surface p-5 sm:p-7" aria-labelledby="criteria-title">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-semibold" id="criteria-title">Criterion evidence</h2>
              <p className="mt-1 text-sm text-muted-foreground">Raw provider results, normalized values, and deterministic weighting.</p>
            </div>
            <span className="text-sm text-muted-foreground">{evaluations?.length ?? 0} criteria</span>
          </div>

          {evaluations?.length && planValidation.success ? (
            <div className="divide-y">
              {evaluations.map((evaluation) => {
                const question = planValidation.data.questions.find((item) => item.id === evaluation.questionId);
                if (!question) return null;
                const contribution = totalWeight === 0
                  ? 0
                  : (evaluation.normalizedScore * evaluation.weight / totalWeight) * 100;
                const rawMaximum = question.jev.type === "score" ? ` / ${question.jev.criteria.length - 1}` : " / 1";

                return (
                  <article className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto]" key={evaluation.questionId}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{question.id}</h3>
                        <Badge variant="outline">{evaluation.type === "score" ? "Score" : "Noul"}</Badge>
                        <Badge variant="neutral">{evaluation.importance}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{question.jev.instructions}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div><dt className="text-muted-foreground">Raw</dt><dd className="mt-1 font-medium">{evaluation.rawValue}{rawMaximum}</dd></div>
                        <div><dt className="text-muted-foreground">Normalized</dt><dd className="mt-1 font-medium">{evaluation.normalizedScore.toFixed(2)}</dd></div>
                        <div><dt className="text-muted-foreground">Weight</dt><dd className="mt-1 font-medium">{evaluation.weight}</dd></div>
                        <div><dt className="text-muted-foreground">Contribution</dt><dd className="mt-1 font-medium">{contribution.toFixed(1)} pts</dd></div>
                      </dl>
                    </div>
                    {evaluation.confidence === undefined ? null : (
                      <p className="text-sm text-muted-foreground sm:text-right">Confidence {Math.round(evaluation.confidence * 100)}%</p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">
              {application.status === "processing" ? "Evaluation is still processing." : "Criterion evidence is unavailable for this application."}
            </p>
          )}
        </section>
      </div>
  );
}
