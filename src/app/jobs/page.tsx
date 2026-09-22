import {
  BriefcaseBusinessIcon,
  FileTextIcon,
  LogOutIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r bg-surface lg:flex lg:flex-col">
        <div className="flex h-24 items-center gap-3 px-7">
          <span aria-hidden="true" className="relative block size-7">
            <span className="absolute top-0 right-0 size-4 rounded-md bg-primary/70" />
            <span className="absolute bottom-0 left-0 size-4 rounded-md bg-primary" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Jev Match</span>
        </div>
        <nav aria-label="Main navigation" className="flex flex-col gap-1 px-3">
          <Link className="flex h-12 items-center gap-3 rounded-lg border-l-2 border-primary bg-primary-soft px-4 text-sm font-medium text-primary" href="/jobs">
            <BriefcaseBusinessIcon aria-hidden="true" />
            Jobs
          </Link>
          <span className="flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-muted-foreground">
            <FileTextIcon aria-hidden="true" />
            Applications
          </span>
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t p-5">
          <Avatar><AvatarFallback>{(recruiter.email?.slice(0, 2) ?? "JM").toUpperCase()}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Recruiter</p>
            <p className="truncate text-xs text-muted-foreground">{recruiter.email ?? "Signed-in account"}</p>
          </div>
          <form action={signOut}>
            <Button aria-label="Sign out" size="icon-sm" type="submit" variant="ghost">
              <LogOutIcon />
            </Button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 lg:hidden">
                <span aria-hidden="true" className="relative block size-7">
                  <span className="absolute top-0 right-0 size-4 rounded-md bg-primary/70" />
                  <span className="absolute bottom-0 left-0 size-4 rounded-md bg-primary" />
                </span>
                <span className="font-semibold">Jev Match</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">Jobs</h1>
              <p className="text-muted-foreground">Create, publish, and review role evaluations.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/jobs/new"><PlusIcon data-icon="inline-start" />New job</Link>
              </Button>
              <form action={signOut} className="lg:hidden">
                <Button type="submit" variant="outline"><LogOutIcon data-icon="inline-start" />Sign out</Button>
              </form>
            </div>
          </header>

          <section aria-label="Jobs summary" className="grid overflow-hidden rounded-xl border bg-surface sm:grid-cols-3">
            {[
              ["Open roles", publishedCount, "Published and accepting applications"],
              ["Drafts", draftCount, "Not yet published"],
              ["Candidates", candidateCount, "Total across your roles"],
            ].map(([label, value, detail], index) => (
              <div className={`flex flex-col gap-1 p-6 ${index > 0 ? "border-t sm:border-t-0 sm:border-l" : ""}`} key={label}>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="job-list-title" className="flex flex-col gap-5">
            <h2 className="sr-only" id="job-list-title">Job list</h2>
            <div className="overflow-hidden rounded-xl border bg-surface">
              {jobs?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-14 px-5">Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Candidates</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-36"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow className="h-20" key={job.id}>
                        <TableCell className="px-5">
                          <div className="flex flex-col gap-1">
                            <Link className="font-medium hover:text-primary hover:underline" href={`/jobs/${job.id}`}>{job.title ?? "Untitled job"}</Link>
                            <span className="text-sm text-muted-foreground">Owned by your recruiter account</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={job.status === "published" ? "success" : "neutral"}>{job.status}</Badge></TableCell>
                        <TableCell>{applicationCounts.get(job.id) ?? 0}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(job.updated_at)}</TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="outline"><Link href={`/jobs/${job.id}`}>{job.status === "draft" ? "Continue editing" : "Review"}</Link></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-7">
                  <h2 className="text-2xl font-semibold tracking-tight">No jobs yet</h2>
                  <p className="mt-3 max-w-xl text-muted-foreground">Create a draft job to begin preparing an evaluation plan.</p>
                  <Button asChild className="mt-5"><Link href="/jobs/new"><PlusIcon data-icon="inline-start" />Create your first job</Link></Button>
                </div>
              )}
              {jobs?.length ? <p className="border-t px-5 py-4 text-sm text-muted-foreground">Showing {jobs.length} of {jobs.length} jobs</p> : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
