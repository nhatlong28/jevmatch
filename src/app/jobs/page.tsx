import { LogOutIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

export default async function JobsPage() {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    redirect("/sign-in");
  }

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, title, updated_at")
    .eq("recruiter_id", recruiter.id)
    .order("updated_at", { ascending: false });

  return (
    <main className="min-h-screen bg-background p-5 sm:p-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 border-b pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Jev Match</p>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
        </div>
        <form action={signOut}>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/jobs/new">
                <PlusIcon data-icon="inline-start" />
                New job
              </Link>
            </Button>
            <Button type="submit" variant="outline">
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </form>
      </div>
      <section className="mx-auto max-w-5xl py-16">
        <p className="text-sm text-muted-foreground">
          Signed in as {recruiter.email ?? "your recruiter account"}.
        </p>
        {jobs?.length ? (
          <div className="mt-6 overflow-hidden rounded-lg border bg-card">
            {jobs.map((job) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b p-4 last:border-b-0"
                key={job.id}
              >
                <div>
                  <p className="font-medium">{job.title ?? "Untitled job"}</p>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {job.status}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/jobs/${job.id}`}>
                    {job.status === "draft" ? "Continue editing" : "View job"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              No jobs yet
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Create a draft job to begin preparing an evaluation plan.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
