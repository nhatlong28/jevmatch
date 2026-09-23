import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { JobsDashboard } from "@/components/jobs-dashboard";
import { Button } from "@/components/ui/button";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage() {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    redirect("/sign-in");
  }

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, title, location, updated_at")
    .eq("recruiter_id", recruiter.id)
    .order("updated_at", { ascending: false });
  const jobIds = jobs?.map((job) => job.id) ?? [];
  const { data: applications } = jobIds.length
    ? await supabase.from("applications").select("job_id").in("job_id", jobIds)
    : { data: [] };
  const applicationCounts = new Map<string, number>();
  for (const application of applications ?? []) {
    applicationCounts.set(
      application.job_id,
      (applicationCounts.get(application.job_id) ?? 0) + 1,
    );
  }
  const publishedCount = jobs?.filter((job) => job.status === "published").length ?? 0;
  const draftCount = jobs?.filter((job) => job.status === "draft").length ?? 0;
  const candidateCount = applications?.length ?? 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Recruiter workspace</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">Jobs</h1>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
            Create, publish, and review role evaluations.
          </p>
        </div>
        <Button asChild className="self-start">
          <Link href="/jobs/new"><PlusIcon data-icon="inline-start" />New job</Link>
        </Button>
      </header>

      <section aria-label="Jobs summary" className="grid overflow-hidden rounded-[14px] border bg-surface sm:grid-cols-3">
        {[
          ["Open roles", publishedCount, "Published and accepting applications"],
          ["Drafts", draftCount, "Not yet published"],
          ["Candidates", candidateCount, "Total across your roles"],
        ].map(([label, value, detail], index) => (
          <div className={`flex flex-col gap-1 p-5 sm:p-6 ${index > 0 ? "border-t sm:border-t-0 sm:border-l" : ""}`} key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
        ))}
      </section>

      {jobs?.length ? (
        <JobsDashboard
          jobs={jobs.map((job) => ({
            candidates: applicationCounts.get(job.id) ?? 0,
            id: job.id,
            location: job.location,
            status: job.status,
            title: job.title,
            updatedAt: job.updated_at,
          }))}
        />
      ) : (
        <section className="rounded-[14px] border bg-surface p-7 sm:p-9">
          <h2 className="text-2xl font-semibold tracking-[-0.035em]">Create your first Job</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted-foreground">
            Create a draft Job to begin preparing an evaluation plan.
          </p>
          <Button asChild className="mt-6">
            <Link href="/jobs/new"><PlusIcon data-icon="inline-start" />New job</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
