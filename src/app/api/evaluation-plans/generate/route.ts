import { NextResponse } from "next/server";

import { EvaluationPlanGenerationError, generateEvaluationPlan } from "@/lib/ai/generate-evaluation-plan";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { JobDescriptionError, processJobDescription } from "@/lib/job-descriptions";

export async function POST(request: Request) {
  if (!(await getCurrentRecruiter())) return NextResponse.json({ error: "Sign in to generate an evaluation plan." }, { status: 401 });
  const formData = await request.formData();
  const pastedText = String(formData.get("jdText") ?? "");
  const uploadedFile = formData.get("jdFile");
  const hasPastedText = Boolean(pastedText.trim());
  const hasFile = uploadedFile instanceof File && uploadedFile.size > 0;
  if (hasPastedText === hasFile) return NextResponse.json({ error: "Paste a job description or choose one file." }, { status: 400 });
  try {
    const description = await processJobDescription(hasFile ? { kind: "file", file: uploadedFile } : { kind: "pasted", text: pastedText });
    return NextResponse.json({ plan: await generateEvaluationPlan(description.text) });
  } catch (error) {
    if (error instanceof JobDescriptionError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof EvaluationPlanGenerationError) {
      return NextResponse.json(
        { error: "The provider returned an invalid evaluation plan. Try generating again." },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "The evaluation service is unavailable. Try again." }, { status: 503 });
  }
}
