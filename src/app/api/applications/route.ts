import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { evaluateApplication } from "@/lib/ai/evaluate-resume";
import { processResume, ResumeError } from "@/lib/resumes";
import { createAdminClient } from "@/lib/supabase/admin";

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function validEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "");
  const candidateName = String(formData.get("candidateName") ?? "").trim();
  const candidateEmail = String(formData.get("candidateEmail") ?? "").trim().toLowerCase();
  const resume = formData.get("resume");

  if (!slug || !candidateName || !validEmail(candidateEmail)) {
    return NextResponse.json({ error: "Enter your full name and a valid email address." }, { status: 400 });
  }
  if (!(resume instanceof File)) {
    return NextResponse.json({ error: "Choose a PDF resume." }, { status: 400 });
  }

  try {
    const processedResume = await processResume(resume);
    const supabase = createAdminClient();
    const path = `${randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, processedResume.file, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: "We could not securely store this file. Try again." }, { status: 500 });
    }

    const { data, error } = await supabase.rpc("record_public_application_submission", {
      submitted_candidate_email: candidateEmail,
      submitted_candidate_name: candidateName,
      submitted_resume_file_path: path,
      submitted_resume_text: processedResume.text,
      submitted_slug: slug,
      submitting_ip: requestIp(request),
    });
    const result = data?.[0];
    if (error || !result?.application_id) {
      await supabase.storage.from("resumes").remove([path]);
      if (result?.result === "duplicate_email") {
        return NextResponse.json({ error: "An application with this email has already been submitted for this role." }, { status: 409 });
      }
      if (result?.result === "rate_limited") {
        return NextResponse.json({ error: "Try again later. This application link accepts up to 3 submissions per hour from one network." }, { status: 429 });
      }
      if (result?.result === "job_not_accepting") {
        return NextResponse.json({ error: "This role is no longer accepting applications." }, { status: 404 });
      }
      return NextResponse.json({ error: "We could not submit your application. Try again." }, { status: 500 });
    }

    await evaluateApplication(result.application_id);
    return NextResponse.json({ id: result.application_id }, { status: 201 });
  } catch (error) {
    if (error instanceof ResumeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "We could not submit your application. Try again." }, { status: 500 });
  }
}
