import { NextResponse } from "next/server";

import {
  EvaluationPlanGenerationError,
  generateEvaluationPlan,
} from "@/lib/ai/generate-evaluation-plan";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createClient } from "@/lib/supabase/server";
import { validateEvaluationPlan } from "@/lib/domain/evaluation-plan";

export async function POST(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return NextResponse.json({ error: "Sign in to generate an evaluation plan." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const supabase = await createClient();
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, jd_text, status")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  if (job.status !== "draft") {
    return NextResponse.json({ error: "Only draft jobs can generate an evaluation plan." }, { status: 409 });
  }
  if (!job.jd_text?.trim()) {
    return NextResponse.json({ error: "This job has no usable job description." }, { status: 400 });
  }

  try {
    const plan = await generateEvaluationPlan(job.jd_text);
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ evaluation_plan: plan })
      .eq("id", job.id);

    if (updateError) {
      return NextResponse.json({ error: "We could not save the evaluation plan. Try again." }, { status: 500 });
    }

    return NextResponse.json({ questionCount: plan.questions.length });
  } catch (error) {
    if (error instanceof EvaluationPlanGenerationError) {
      return NextResponse.json({ error: "We could not generate a valid evaluation plan. Try again." }, { status: 422 });
    }

    return NextResponse.json({ error: "The evaluation service is unavailable. Try again." }, { status: 503 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  if (!(await getCurrentRecruiter())) {
    return NextResponse.json({ error: "Sign in to update an evaluation plan." }, { status: 401 });
  }
  const { jobId } = await context.params;
  const body = await request.json() as { action?: string; plan?: unknown };
  const validation = validateEvaluationPlan(body.plan);
  if (!validation.success) return NextResponse.json({ error: "Fix the evaluation plan before saving." }, { status: 400 });
  if (body.action !== "save-draft" && body.action !== "publish") {
    return NextResponse.json({ error: "Choose Save draft or Publish job." }, { status: 400 });
  }
  const supabase = await createClient();
  const update = body.action === "publish"
    ? { evaluation_plan: validation.data, public_slug: crypto.randomUUID().replaceAll("-", "").slice(0, 12), status: "published" as const }
    : { evaluation_plan: validation.data };
  const { data, error } = await supabase.from("jobs").update(update).eq("id", jobId).eq("status", "draft").select("id").single();
  if (error || !data) return NextResponse.json({ error: "This draft could not be updated." }, { status: 409 });
  return NextResponse.json({ id: data.id });
}
