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
  const applyPath = `/apply/${publicSlug}`;

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
    <div className="mt-8 space-y-6">
      <section className="space-y-5 rounded-lg border bg-card p-5 shadow-sm sm:p-7">
        <div>
          <p className="font-medium">Public application link</p>
          <a className="mt-2 block break-all text-sm text-primary hover:underline" href={applyPath}>
            {applyPath}
          </a>
        </div>
        {status === "published" ? (
          <>
            <p className="text-sm text-muted-foreground">
              This evaluation plan is locked. Closing the job stops new candidate
              submissions and keeps existing data available to you.
            </p>
            {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
            <Button disabled={isClosing} onClick={closeJob} type="button" variant="destructive">
              {isClosing ? "Closing…" : "Close job"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This job is closed. New candidate submissions are disabled.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border bg-card shadow-sm" aria-labelledby="applications-title">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b p-5 sm:p-7">
          <div>
            <h2 className="text-xl font-semibold" id="applications-title">Applications</h2>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="px-5">
                    <div>
                      <Link className="font-medium hover:text-primary hover:underline" href={`/jobs/${jobId}/applications/${application.id}`}>
                        {application.candidate_name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">{application.candidate_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {application.match_score === null ? "—" : `${Math.round(application.match_score)} / 100`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={application.status === "evaluated" ? "success" : "neutral"}>
                      {application.status === "evaluated" ? "Evaluated" : application.status === "processing" ? "Processing" : "Evaluation unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(application.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-7 text-sm text-muted-foreground">No applications have been submitted yet.</p>
        )}
      </section>
    </div>
  );
}
