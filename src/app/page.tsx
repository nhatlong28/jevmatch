import { redirect } from "next/navigation";

import { getCurrentRecruiter } from "@/lib/auth/recruiter";

export default async function HomePage() {
  redirect((await getCurrentRecruiter()) ? "/jobs" : "/sign-in");
}
