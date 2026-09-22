"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type PublishedJobProps = {
  publicSlug: string;
  jobId: string;
  status: "published" | "closed";
};

export function PublishedJob({ jobId, publicSlug, status }: PublishedJobProps) {
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
    <section className="mt-8 space-y-5 rounded-lg border bg-card p-5 shadow-sm sm:p-7">
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
  );
}
