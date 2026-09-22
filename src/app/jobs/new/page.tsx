import { redirect } from "next/navigation";

import { getCurrentRecruiter } from "@/lib/auth/recruiter";

import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-background p-5 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">Jobs / New job</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create a job</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Add a role title and job description. You will review the evaluation plan
          and publish from the saved draft.
        </p>
        <section className="mt-8 rounded-lg border bg-card p-5 shadow-sm sm:p-7">
          <JobForm />
        </section>
      </div>
    </main>
  );
}
