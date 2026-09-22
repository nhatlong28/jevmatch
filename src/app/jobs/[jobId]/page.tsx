import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { validateEvaluationPlan } from "@/lib/domain/evaluation-plan";
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

  return (
    <main className="min-h-screen bg-background p-5 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/jobs">Jobs</Link>
          {" / "}{job.title ?? "Untitled job"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {job.status === "draft" ? "Prepare evaluation plan" : "Published job"}
        </h1>
        <p className="mt-3 text-muted-foreground">This job is currently {job.status}.</p>
        {job.status === "draft" ? (
          <EvaluationPlanGenerator initialPlan={initialPlan} jobId={job.id} />
        ) : job.public_slug ? (
          <PublishedJob
            jobId={job.id}
            publicSlug={job.public_slug}
            status={job.status}
          />
        ) : (
          <p className="mt-8 rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            This job is missing its public link.
          </p>
        )}
      </div>
    </main>
  );
}
