"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type EvaluationPlanGeneratorProps = {
  jobId: string;
  questionCount: number | null;
};

export function EvaluationPlanGenerator({ jobId, questionCount }: EvaluationPlanGeneratorProps) {
  const [error, setError] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(questionCount);
  const [isGenerating, setIsGenerating] = useState(false);

  async function generate() {
    setError(null);
    setIsGenerating(true);
    const response = await fetch(`/api/jobs/${jobId}/evaluation-plan`, { method: "POST" });
    const body: { error?: string; questionCount?: number } = await response.json();
    setIsGenerating(false);

    if (!response.ok || typeof body.questionCount !== "number") {
      setError(body.error ?? "We could not generate an evaluation plan. Try again.");
      return;
    }

    setGeneratedCount(body.questionCount);
  }

  return (
    <section className="mt-8 rounded-lg border bg-card p-5 shadow-sm sm:p-7">
      <p className="text-sm font-medium">Evaluation plan</p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Generate a draft from this job description. You will review and edit every question before publishing.
      </p>
      {error ? (
        <p aria-live="polite" className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {generatedCount !== null ? (
        <p aria-live="polite" className="mt-4 text-sm text-success" role="status">
          Draft generated with {generatedCount} {generatedCount === 1 ? "question" : "questions"}.
        </p>
      ) : null}
      <Button className="mt-5" disabled={isGenerating} onClick={generate} type="button">
        {isGenerating ? "Generating plan…" : generatedCount === null ? "Generate evaluation plan" : "Generate again"}
      </Button>
    </section>
  );
}
