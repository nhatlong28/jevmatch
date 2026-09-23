import { redirect } from "next/navigation";

import { getCurrentRecruiter } from "@/lib/auth/recruiter";

import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-7xl">
      <JobForm />
    </div>
  );
}
