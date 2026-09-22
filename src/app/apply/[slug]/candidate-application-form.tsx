"use client";

import { useState } from "react";
import { FileTextIcon, LoaderCircleIcon, ShieldCheckIcon } from "lucide-react";

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
      <section aria-live="polite" className="rounded-xl border border-success/30 bg-success-soft p-5">
        <h2 className="text-lg font-semibold">Application received</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Thank you. The hiring team will review your application.</p>
      </section>
    );
  }

  return (
    <form action={submit} className="space-y-5" encType="multipart/form-data">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="candidateName">Full name <span className="text-destructive">*</span></label>
        <Input autoComplete="name" className="h-11 rounded-xl" id="candidateName" name="candidateName" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="candidateEmail">Email address <span className="text-destructive">*</span></label>
        <Input autoComplete="email" className="h-11 rounded-xl" id="candidateEmail" name="candidateEmail" required type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="resume">CV <span className="text-destructive">*</span></label>
        <div className="rounded-xl border border-dashed bg-muted/25 p-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary"><FileTextIcon aria-hidden="true" className="size-4" /></span>
            <span>
              <span className="block font-medium">Upload a PDF CV</span>
              <span className="block text-muted-foreground">Up to 10 MB</span>
            </span>
          </div>
          <Input accept="application/pdf" className="mt-4 h-10 rounded-xl" id="resume" name="resume" required type="file" />
        </div>
        <p className="flex gap-2 text-sm leading-5 text-muted-foreground"><ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Your CV is stored privately and used only to evaluate this application.</p>
      </div>
      {error ? <p aria-live="polite" className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button className="w-full sm:w-auto" disabled={submitting} type="submit">
        {submitting ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : null}
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
