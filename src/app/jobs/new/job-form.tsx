"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "paste" | "upload";

export function JobForm() {
  const [mode, setMode] = useState<Mode>("paste");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setJobId(null);
    setIsSubmitting(true);

    if (mode === "paste") {
      formData.delete("jdFile");
    } else {
      formData.delete("jdText");
    }

    const response = await fetch("/api/jobs", { body: formData, method: "POST" });
    const body: { error?: string; id?: string } = await response.json();
    setIsSubmitting(false);

    if (!response.ok || !body.id) {
      setError(body.error ?? "We could not create the draft. Try again.");
      return;
    }

    setJobId(body.id);
  }

  return (
    <form action={submit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="title">
          Job title
        </label>
        <Input id="title" name="title" placeholder="Senior Frontend Engineer" required />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Job description</legend>
        <div className="flex gap-2" role="tablist" aria-label="Job description source">
          <Button
            aria-selected={mode === "paste"}
            onClick={() => setMode("paste")}
            role="tab"
            type="button"
            variant={mode === "paste" ? "default" : "outline"}
          >
            Paste text
          </Button>
          <Button
            aria-selected={mode === "upload"}
            onClick={() => setMode("upload")}
            role="tab"
            type="button"
            variant={mode === "upload" ? "default" : "outline"}
          >
            Upload file
          </Button>
        </div>

        {mode === "paste" ? (
          <textarea
            className="min-h-64 w-full rounded-md border bg-surface px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            id="jdText"
            name="jdText"
            placeholder="Paste the full job description here."
            required
          />
        ) : (
          <div className="rounded-md border border-dashed bg-surface p-5">
            <label className="block text-sm font-medium" htmlFor="jdFile">
              Job description file
            </label>
            <Input
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="mt-3"
              id="jdFile"
              name="jdFile"
              required
              type="file"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              PDF, DOCX, or UTF-8 TXT, up to 10 MB.
            </p>
          </div>
        )}
      </fieldset>

      {error ? (
        <p aria-live="polite" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {jobId ? (
        <div className="rounded-md border border-success bg-success-soft p-4" role="status">
          <p className="font-medium text-success">Draft created</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your job description is ready for evaluation-plan generation.
          </p>
        </div>
      ) : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating draft…" : "Create draft"}
      </Button>
    </form>
  );
}
