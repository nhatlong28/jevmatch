import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  JobDescriptionError,
  processJobDescription,
} from "@/lib/job-descriptions";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createClient } from "@/lib/supabase/server";

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
  const pastedText = String(formData.get("jdText") ?? "");
  const uploadedFile = formData.get("jdFile");
  const hasPastedText = Boolean(pastedText.trim());
  const hasFile = uploadedFile instanceof File && uploadedFile.size > 0;

  if (!title) {
    return NextResponse.json({ error: "Enter a job title." }, { status: 400 });
  }
  if (hasPastedText === hasFile) {
    return NextResponse.json(
      { error: "Paste a job description or choose one file." },
      { status: 400 },
    );
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
        jd_file_path: path,
        jd_text: description.text,
        recruiter_id: recruiter.id,
        status: "draft",
        title,
      })
      .select("id")
      .single();

    if (jobError) {
      if (path) {
        await supabase.storage.from("job-descriptions").remove([path]);
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
