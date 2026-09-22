import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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
    <main className="min-h-screen bg-background p-5 sm:p-8">
      <section className="mx-auto max-w-2xl rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm text-muted-foreground">Jev Match</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {job.title ?? "Open role"}
        </h1>
        <p className="mt-4 text-muted-foreground">
          This role is accepting applications. The application form will be
          available here shortly.
        </p>
      </section>
    </main>
  );
}
