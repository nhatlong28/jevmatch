import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { validateEvaluationPlan } from "@/lib/domain/evaluation-plan";
import { orderApplications } from "@/lib/domain/application-review";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createClient } from "@/lib/supabase/server";

import { EvaluationPlanGenerator } from "./evaluation-plan-generator";
import { PublishedJob } from "./published-job";

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
    .select("id, evaluation_plan, public_slug, status, title")
    .eq("id", jobId)
    .single();

  if (!job) notFound();

  const validation = validateEvaluationPlan(job.evaluation_plan);
  const initialPlan = validation.success ? validation.data : null;
  const { data: applications } = job.status === "draft"
    ? { data: [] }
    : await supabase
      .from("applications")
      .select("id, candidate_name, candidate_email, match_score, status, created_at")
      .eq("job_id", job.id);
  const orderedApplications = orderApplications(applications ?? []);
  const isDraft = job.status === "draft";

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-start sm:justify-between">
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
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
            {isDraft
              ? "Drafted from the Job Description. Review every question before publishing."
              : "Match Scores summarize evidence against this Job's published criteria. Review the full application before making a decision."}
          </p>
        </div>
      </header>

      <div className="mt-8">
        {isDraft ? (
          <EvaluationPlanGenerator initialPlan={initialPlan} jobId={job.id} />
        ) : job.public_slug ? (
          <PublishedJob
            applications={orderedApplications}
            jobId={job.id}
            publicSlug={job.public_slug}
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
