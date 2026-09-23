"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PublishedJobActions({
  jobId,
  publicSlug,
  status,
}: {
  jobId: string;
  publicSlug: string;
  status: "published" | "closed";
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const applyUrl = typeof window === "undefined" ? `/apply/${publicSlug}` : new URL(`/apply/${publicSlug}`, window.location.origin).toString();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(`Clipboard access is unavailable. Copy this path manually: ${applyUrl}`);
    }
  }

  async function closeJob() {
    if (!window.confirm("Close this job? Candidates will no longer be able to submit, but existing applications will remain available.")) return;
    setError(null);
    setIsClosing(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/evaluation-plan`, {
        body: JSON.stringify({ action: "close" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "We could not close this job.");
        return;
      }
      router.refresh();
    } catch {
      setError("We could not close this job. Check your connection and try again.");
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void copyLink()} type="button" variant="outline">
          {copied ? "Link copied" : "Copy application link"}
        </Button>
        {status === "published" ? (
          <Button disabled={isClosing} onClick={() => void closeJob()} type="button" variant="outline">
            {isClosing ? "Closing…" : "Close job"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="max-w-sm text-right text-xs text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
