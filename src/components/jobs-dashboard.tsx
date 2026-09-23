"use client";

import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DashboardJob = {
  candidates: number;
  id: string;
  location: string | null;
  status: "draft" | "published" | "closed";
  title: string | null;
  updatedAt: string;
};

type JobsDashboardProps = {
  jobs: DashboardJob[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function statusLabel(status: DashboardJob["status"]) {
  return status[0].toUpperCase() + status.slice(1);
}

export function JobsDashboard({ jobs }: JobsDashboardProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DashboardJob["status"]>("all");

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return jobs.filter((job) => {
      const searchable = `${job.title ?? "Untitled job"} ${job.location ?? ""}`.toLocaleLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus = status === "all" || job.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [jobs, query, status]);

  return (
    <section aria-labelledby="job-list-title" className="rounded-[14px] border bg-surface">
      <h2 className="sr-only" id="job-list-title">Job list</h2>
      <div className="flex flex-col gap-3 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-lg">
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search jobs"
            className="h-10 rounded-xl pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search roles"
            value={query}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontalIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          <Select onValueChange={(value) => setStatus(value as typeof status)} value={status}>
            <SelectTrigger aria-label="Filter jobs by status" className="h-10 w-full rounded-xl sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-14 px-5">Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-36"><span className="sr-only">Review</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleJobs.map((job) => (
              <TableRow className="h-[76px]" key={job.id}>
                <TableCell className="px-5">
                  <Link className="font-medium hover:text-primary hover:underline" href={`/jobs/${job.id}`}>
                    {job.title ?? "Untitled job"}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[job.location, job.status === "draft" ? "Evaluation plan in progress" : "Evaluation plan locked"].filter(Boolean).join(" · ")}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={job.status === "published" ? "success" : "neutral"}>
                    {statusLabel(job.status)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium tabular-nums">{job.candidates}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(job.updatedAt)}</TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/jobs/${job.id}`}>
                      {job.status === "draft" ? "Continue editing" : "Review"}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y md:hidden">
        {visibleJobs.map((job) => (
          <article className="space-y-4 p-5" key={job.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="font-medium hover:text-primary hover:underline" href={`/jobs/${job.id}`}>
                  {job.title ?? "Untitled job"}
                </Link>
                {job.location ? <p className="mt-1 text-xs text-muted-foreground">{job.location}</p> : null}
                <p className="mt-1 text-sm text-muted-foreground">Updated {formatDate(job.updatedAt)}</p>
              </div>
              <Badge variant={job.status === "published" ? "success" : "neutral"}>
                {statusLabel(job.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{job.candidates} candidates</span>
              <Button asChild size="sm" variant="outline">
                <Link href={`/jobs/${job.id}`}>
                  {job.status === "draft" ? "Continue editing" : "Review"}
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      {visibleJobs.length ? (
        <p className="border-t px-5 py-4 text-sm text-muted-foreground">
          Showing {visibleJobs.length} of {jobs.length} jobs
        </p>
      ) : (
        <div className="p-7">
          <h2 className="text-lg font-semibold" id="job-list-title">No matching Jobs</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different role name or clear the status filter.
          </p>
        </div>
      )}
    </section>
  );
}
