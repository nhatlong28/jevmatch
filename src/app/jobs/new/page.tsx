import { CheckCircle2Icon, FileTextIcon, InfoIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRecruiter } from "@/lib/auth/recruiter";

import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="border-b pb-7">
        <p className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/jobs">Jobs</Link>
          <span aria-hidden="true"> / </span>
          New job
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Create a job</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-6 text-muted-foreground">
          Add a role title and Job Description. Jev Match prepares an editable
          Evaluation Plan draft for your review.
        </p>
      </header>

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[14px] border bg-surface p-5 sm:p-7">
          <div className="mb-7 flex items-start gap-3 border-b pb-6">
            <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <FileTextIcon aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.025em]">Role details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with the role and the source Job Description.
              </p>
            </div>
          </div>
          <JobForm />
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <section className="rounded-[14px] border bg-surface p-5">
            <h2 className="text-lg font-semibold">Before you generate</h2>
            <ul className="mt-5 grid gap-5 text-sm">
              {[
                ["Role title", "Name the role clearly so the draft has useful context."],
                ["Job Description", "Include responsibilities and the requirements to assess."],
                ["Review before publish", "Generated questions stay editable until you approve the plan."],
              ].map(([title, description]) => (
                <li className="flex gap-3" key={title}>
                  <CheckCircle2Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>
                    <span className="block font-medium text-foreground">{title}</span>
                    <span className="mt-1 block leading-5 text-muted-foreground">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[14px] border border-primary/25 bg-primary-soft/55 p-4 text-sm">
            <div className="flex gap-3">
              <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="leading-5 text-secondary-foreground">
                The generated plan is a draft. You will review every question,
                type, and importance before publishing.
              </p>
            </div>
          </section>
          <p className="flex gap-3 px-1 text-sm leading-5 text-muted-foreground">
            <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Job Descriptions are processed securely on the server to prepare the
            draft.
          </p>
        </aside>
      </div>
    </div>
  );
}
