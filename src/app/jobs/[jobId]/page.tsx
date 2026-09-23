import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { validateEvaluationPlan } from "@/lib/domain/evaluation-plan";
import { orderApplications, readApplicationEvaluations } from "@/lib/domain/application-review";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createClient } from "@/lib/supabase/server";

import { EvaluationPlanGenerator } from "./evaluation-plan-generator";
import { PublishedJob } from "./published-job";
import { PublishedJobActions } from "./published-job-actions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/sign-in");

  const { jobId } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, evaluation_plan, public_slug, status, title, updated_at")
    .eq("id", jobId)
    .single();

  if (!job) notFound();

  const validation = validateEvaluationPlan(job.evaluation_plan);
  const initialPlan = validation.success ? validation.data : null;
  const { data: applications } = job.status === "draft"
      ? { data: [] }
      : await supabase
        .from("applications")
      .select("id, candidate_name, candidate_email, match_score, status, created_at, evaluations, first_viewed_at, reviewed_at")
      .eq("job_id", job.id);
  const orderedApplications = orderApplications(applications ?? []);
  const isDraft = job.status === "draft";

  return (
    <div className={`mx-auto max-w-7xl ${isDraft ? "" : "flex h-[calc(100dvh-9rem)] flex-col overflow-hidden sm:h-[calc(100dvh-9.5rem)] lg:h-[calc(100dvh-3.5rem)]"}`}>
      <header className={`flex shrink-0 flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between ${isDraft ? "sm:gap-5 sm:pb-7" : ""}`}>
        <div>
          <p className="text-sm text-muted-foreground">
            <Link className="hover:text-foreground" href="/jobs">Jobs</Link>
            <span aria-hidden="true"> / </span>
            {job.title ?? "Untitled job"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-[-0.045em]">
              {isDraft ? "Evaluation plan" : "Applications"}
            </h1>
            <Badge variant={job.status === "published" ? "success" : "neutral"}>
              {job.status[0].toUpperCase() + job.status.slice(1)}
            </Badge>
          </div>
          <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
            {isDraft
              ? "Drafted from the Job Description. Review every question before publishing."
              : <>{orderedApplications.length} {orderedApplications.length === 1 ? "candidate" : "candidates"} · {job.status === "published" ? "Published" : "Closed"} {formatDate(job.updated_at)}</>}
          </p>
        </div>
        {!isDraft && job.public_slug ? (
          <PublishedJobActions jobId={job.id} publicSlug={job.public_slug} status={job.status === "published" ? "published" : "closed"} />
        ) : null}
      </header>

      <div className={isDraft ? "mt-8" : "mt-4 min-h-0 flex-1"}>
        {isDraft ? (
          <EvaluationPlanGenerator initialPlan={initialPlan} jobId={job.id} />
        ) : job.public_slug ? (
          <PublishedJob
            applications={orderedApplications.map((application) => ({
              id: application.id,
              candidate_name: application.candidate_name,
              candidate_email: application.candidate_email,
              match_score: application.match_score,
              status: application.status,
              created_at: application.created_at,
              first_viewed_at: application.first_viewed_at,
              reviewed_at: application.reviewed_at,
              evidenceCount: initialPlan
                ? readApplicationEvaluations(initialPlan, application.evaluations)?.length ?? 0
                : 0,
              totalCriteria: initialPlan?.questions.length ?? 0,
            }))}
            status={job.status === "published" ? "published" : "closed"}
          />
        ) : (
          <p className="rounded-[14px] border bg-surface p-5 text-sm text-muted-foreground">
            This job is missing its public link.
          </p>
        )}
      </div>
    </div>
  );
}
