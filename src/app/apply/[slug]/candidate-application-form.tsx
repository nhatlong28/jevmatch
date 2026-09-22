"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { slug: string };

export function CandidateApplicationForm({ slug }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    formData.set("slug", slug);
    try {
      const response = await fetch("/api/applications", { body: formData, method: "POST" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "We could not submit your application. Try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("We could not submit your application. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section aria-live="polite" className="rounded-lg border border-success bg-success-soft p-5">
        <h2 className="text-lg font-semibold">Application received</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thank you. The hiring team will review your application.</p>
      </section>
    );
  }

  return (
    <form action={submit} className="space-y-5" encType="multipart/form-data">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="candidateName">Full name</label>
        <Input autoComplete="name" id="candidateName" name="candidateName" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="candidateEmail">Email address</label>
        <Input autoComplete="email" id="candidateEmail" name="candidateEmail" required type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="resume">Resume</label>
        <Input accept="application/pdf" id="resume" name="resume" required type="file" />
        <p className="text-sm text-muted-foreground">PDF only, up to 10 MB. Your resume is stored privately.</p>
      </div>
      {error ? <p aria-live="polite" className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button className="w-full sm:w-auto" disabled={submitting} type="submit">
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
