import { NextResponse } from "next/server";

import { getCurrentRecruiter } from "@/lib/auth/recruiter";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ReviewAction = "open" | "mark-reviewed";

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  if (!(await getCurrentRecruiter())) {
    return NextResponse.json({ error: "Sign in to review applications." }, { status: 401 });
  }

  let action: ReviewAction;
  try {
    const body = await request.json() as { action?: unknown };
    if (body.action !== "open" && body.action !== "mark-reviewed") {
      return NextResponse.json({ error: "Choose a valid review action." }, { status: 400 });
    }
    action = body.action;
  } catch {
    return NextResponse.json({ error: "Choose a valid review action." }, { status: 400 });
  }

  const { applicationId } = await context.params;
  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("id, job_id, candidate_name, candidate_email, match_score, evaluations, status, created_at, first_viewed_at, reviewed_at")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, title, evaluation_plan")
    .eq("id", application.job_id)
    .maybeSingle();

  if (!job || job.status === "draft") {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  if (action === "open" && !application.first_viewed_at) {
    const { error } = await admin
      .from("applications")
      .update({ first_viewed_at: new Date().toISOString() })
      .eq("id", application.id)
      .eq("job_id", job.id)
      .is("first_viewed_at", null);
    if (error) {
      return NextResponse.json({ error: "We could not update the review status." }, { status: 500 });
    }
  }

  if (action === "mark-reviewed") {
    if (!application.first_viewed_at) {
      return NextResponse.json({ error: "Open this application before marking it reviewed." }, { status: 409 });
    }
    if (!application.reviewed_at) {
      const { error } = await admin
        .from("applications")
        .update({ reviewed_at: new Date().toISOString() })
        .eq("id", application.id)
        .eq("job_id", job.id)
        .not("first_viewed_at", "is", null)
        .is("reviewed_at", null);
      if (error) {
        return NextResponse.json({ error: "We could not update the review status." }, { status: 500 });
      }
    }
  }

  const { data: current } = await supabase
    .from("applications")
    .select("first_viewed_at, reviewed_at")
    .eq("id", application.id)
    .maybeSingle();

  return NextResponse.json({
    application: {
      id: application.id,
      candidate_name: application.candidate_name,
      candidate_email: application.candidate_email,
      match_score: application.match_score,
      evaluations: application.evaluations,
      status: application.status,
      created_at: application.created_at,
      first_viewed_at: current?.first_viewed_at ?? application.first_viewed_at,
      reviewed_at: current?.reviewed_at ?? application.reviewed_at,
    },
    job: { title: job.title, evaluation_plan: job.evaluation_plan },
  });
}
