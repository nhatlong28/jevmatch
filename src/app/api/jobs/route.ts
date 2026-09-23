import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  JobDescriptionError,
  processJobDescription,
} from "@/lib/job-descriptions";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createClient } from "@/lib/supabase/server";
import { type EvaluationPlan, validateEvaluationPlan } from "@/lib/domain/evaluation-plan";

function extensionFor(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/plain") return "txt";
  return "docx";
}

export async function POST(request: Request) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return NextResponse.json({ error: "Sign in to create a job." }, { status: 401 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const pastedText = String(formData.get("jdText") ?? "");
  const uploadedFile = formData.get("jdFile");
  const planJson = String(formData.get("evaluationPlan") ?? "");
  const action = String(formData.get("action") ?? "save-draft");
  const confirmed = String(formData.get("confirmed") ?? "") === "true";
  const hasPastedText = Boolean(pastedText.trim());
  const hasFile = uploadedFile instanceof File && uploadedFile.size > 0;

  if (!title || !location) {
    return NextResponse.json({ error: "Enter a job title and location." }, { status: 400 });
  }
  if (action !== "save-draft" && action !== "publish") {
    return NextResponse.json({ error: "Choose Save draft or Publish job." }, { status: 400 });
  }
  if (hasPastedText === hasFile) {
    return NextResponse.json(
      { error: "Paste a job description or choose one file." },
      { status: 400 },
    );
  }
  let evaluationPlan: EvaluationPlan | null = null;
  if (planJson.trim()) {
    let plan: unknown;
    try { plan = JSON.parse(planJson); } catch {
      return NextResponse.json({ error: "Submit a valid evaluation plan." }, { status: 400 });
    }
    const planValidation = validateEvaluationPlan(plan);
    if (!planValidation.success) {
      return NextResponse.json(
        { error: "Fix the evaluation plan before saving.", issues: planValidation.issues },
        { status: 400 },
      );
    }
    evaluationPlan = planValidation.data;
  }
  if (action === "publish" && !confirmed) {
    return NextResponse.json({ error: "Review and confirm the Evaluation Plan before publishing." }, { status: 400 });
  }
  if (action === "publish" && !evaluationPlan) {
    return NextResponse.json({ error: "Generate and review an Evaluation Plan before publishing." }, { status: 400 });
  }

  try {
    const description = await processJobDescription(
      hasFile
        ? { kind: "file", file: uploadedFile }
        : { kind: "pasted", text: pastedText },
    );
    const supabase = await createClient();
    const path = description.file
      ? `${recruiter.id}/${randomUUID()}.${extensionFor(description.mimeType!)}`
      : null;

    if (description.file && path) {
      const { error } = await supabase.storage
        .from("job-descriptions")
        .upload(path, description.file, {
          contentType: description.mimeType,
          upsert: false,
        });

      if (error) {
        return NextResponse.json(
          { error: "We could not securely store this file. Try again." },
          { status: 500 },
        );
      }
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        evaluation_plan: evaluationPlan,
        jd_file_path: path,
        jd_text: description.text,
        location,
        recruiter_id: recruiter.id,
        public_slug: action === "publish" ? crypto.randomUUID().replaceAll("-", "").slice(0, 12) : null,
        status: action === "publish" ? "published" : "draft",
        title,
      })
      .select("id")
      .single();

    if (jobError) {
      if (path) {
        await supabase.storage.from("job-descriptions").remove([path]);
      }
      if (jobError.code === "42703" || jobError.code === "PGRST204") {
        return NextResponse.json(
          { error: "The database needs its pending schema update before this job can be saved. The uploaded file was removed; please retry after the update." },
          { status: 503 },
        );
      }
      if (jobError.message.includes("published jobs require a valid Evaluation Plan")) {
        return NextResponse.json(
          { error: "The Evaluation Plan is invalid or the publish confirmation is missing. Review the plan and try again." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "We could not create the draft. Your file was not saved." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: job.id }, { status: 201 });
  } catch (error) {
    if (error instanceof JobDescriptionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "We could not create the draft. Try again." },
      { status: 500 },
    );
  }
}
