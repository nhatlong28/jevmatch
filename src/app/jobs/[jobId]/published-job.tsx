"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export type PublishedApplication = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  match_score: number | null;
  status: "processing" | "evaluated" | "failed";
  created_at: string;
};

type PublishedJobProps = {
  publicSlug: string;
  jobId: string;
  status: "published" | "closed";
  applications: PublishedApplication[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function PublishedJob({ jobId, publicSlug, status, applications }: PublishedJobProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(applications[0]?.id ?? null);
  const applyPath = `/apply/${publicSlug}`;
  const selectedApplication = applications.find((application) => application.id === selectedId) ?? applications[0];

  async function closeJob() {
    setError(null);
    setIsClosing(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/evaluation-plan`, {
        body: JSON.stringify({ action: "close" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "We could not close this job.");
        return;
      }
      router.refresh();
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-[14px] border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p className="font-medium">Public application link</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Share this link when candidates are ready to apply. The published
            Evaluation Plan is locked for every submission.
          </p>
        </div>
        <Button asChild className="shrink-0" variant="outline">
          <a href={applyPath} rel="noreferrer" target="_blank">Open application</a>
        </Button>
      </section>
      {status === "published" ? (
        <section className="flex flex-col gap-3 rounded-[14px] border border-primary/25 bg-primary-soft/55 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-5 text-secondary-foreground">
            This plan is locked. Closing the Job stops new submissions and keeps
            existing application data available.
          </p>
          <Button disabled={isClosing} onClick={closeJob} type="button" variant="destructive">
            {isClosing ? "Closing…" : "Close job"}
          </Button>
          {error ? <p className="text-destructive" role="alert">{error}</p> : null}
        </section>
      ) : (
        <p className="rounded-[14px] border bg-muted/40 p-4 text-sm text-muted-foreground">
          This Job is closed. New candidate submissions are disabled.
        </p>
      )}

      <section className="rounded-[14px] border border-primary/25 bg-primary-soft/45 p-4 text-sm text-secondary-foreground">
        Match Scores summarize evidence against this Job&apos;s published criteria.
        Review the full application and original CV together.
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-[14px] border bg-surface" aria-labelledby="applications-title">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.025em]" id="applications-title">Applications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {applications.length} {applications.length === 1 ? "candidate" : "candidates"} · evaluated applications appear first by Match Score.
            </p>
          </div>
          <Badge variant={status === "published" ? "success" : "neutral"}>{status}</Badge>
        </div>
        {applications.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-12 px-5">Candidate</TableHead>
                <TableHead>Match Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-20"><span className="sr-only">Preview</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow data-state={application.id === selectedApplication?.id ? "selected" : undefined} key={application.id}>
                  <TableCell className="px-5">
                    <div>
                      <Link className="font-medium hover:text-primary hover:underline" href={`/jobs/${jobId}/applications/${application.id}`}>
                        {application.candidate_name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">{application.candidate_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {application.match_score === null ? "—" : `${Math.round(application.match_score)} / 100`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={application.status === "evaluated" ? "success" : "neutral"}>
                      {application.status === "evaluated" ? "Evaluated" : application.status === "processing" ? "Processing" : "Evaluation unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(application.created_at)}</TableCell>
                  <TableCell>
                    <Button aria-pressed={application.id === selectedApplication?.id} onClick={() => setSelectedId(application.id)} size="xs" type="button" variant="ghost">
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-7 text-sm text-muted-foreground">No applications have been submitted yet.</p>
        )}
      </section>

      <aside className="rounded-[14px] border bg-surface p-5 sm:p-6 xl:sticky xl:top-5 xl:self-start">
        {selectedApplication ? (
          <div>
            <p className="text-sm text-muted-foreground">Candidate preview</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">{selectedApplication.candidate_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedApplication.candidate_email}</p>
            <dl className="mt-6 grid gap-5 border-y py-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Match Score</dt>
                <dd className="text-2xl font-semibold tracking-[-0.04em] tabular-nums">
                  {selectedApplication.match_score === null ? "—" : `${Math.round(selectedApplication.match_score)} / 100`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd><Badge variant={selectedApplication.status === "evaluated" ? "success" : "neutral"}>{selectedApplication.status}</Badge></dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Applied</dt>
                <dd className="font-medium">{formatDate(selectedApplication.created_at)}</dd>
              </div>
            </dl>
            <Button asChild className="mt-6 w-full">
              <Link href={`/jobs/${jobId}/applications/${selectedApplication.id}`}>View full application</Link>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a candidate to preview their application.</p>
        )}
      </aside>
      </div>
    </div>
  );
}
