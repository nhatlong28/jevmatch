import { redirect } from "next/navigation";

import { RecruiterShell } from "@/components/recruiter-shell";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";

export default async function JobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    redirect("/sign-in");
  }

  return (
    <RecruiterShell active="jobs" email={recruiter.email}>
      {children}
    </RecruiterShell>
  );
}
