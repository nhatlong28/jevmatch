import { notFound } from "next/navigation";

import { BriefcaseBusinessIcon } from "lucide-react";
import { JevMatchBrand } from "@/components/jev-match-brand";
import { createClient } from "@/lib/supabase/server";
import { CandidateApplicationForm } from "./candidate-application-form";

export default async function PublicJobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: jobs } = await supabase.rpc("published_job_for_slug", {
    requested_slug: slug,
  });
  const job = jobs?.[0];

  if (!job) notFound();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[780px]">
        <header className="mb-8">
          <JevMatchBrand />
        </header>
        <section className="rounded-[14px] border bg-surface p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <BriefcaseBusinessIcon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Open role</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {job.title ?? "Open role"}
              </h1>
              {job.location ? <p className="mt-2 text-sm text-muted-foreground">{job.location}</p> : null}
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-[15px] leading-6 text-muted-foreground">
            This role is accepting applications. Provide your contact details and
            a PDF CV to submit your application.
          </p>
          <div className="my-7 border-t" />
          <h2 className="text-xl font-semibold tracking-[-0.025em]">Apply for this role</h2>
          <p className="mt-2 text-sm text-muted-foreground">Fields marked * are required.</p>
          <div className="mt-6">
        <CandidateApplicationForm slug={job.public_slug} />
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-muted-foreground">Powered by Jev Match</p>
      </div>
    </main>
  );
}
