import { NextResponse } from "next/server";

import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  if (!(await getCurrentRecruiter())) {
    return NextResponse.json({ error: "Sign in to view this resume." }, { status: 401 });
  }

  const { applicationId } = await context.params;
  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("resume_file_path")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application?.resume_file_path) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("resumes")
    .createSignedUrl(application.resume_file_path, 300);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
