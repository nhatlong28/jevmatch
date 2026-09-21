import { LogOutIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";

import { signOut } from "./actions";

export default async function JobsPage() {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-background p-5 sm:p-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 border-b pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Jev Match</p>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
        </div>
        <form action={signOut}>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/jobs/new">
                <PlusIcon data-icon="inline-start" />
                New job
              </Link>
            </Button>
            <Button type="submit" variant="outline">
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </form>
      </div>
      <section className="mx-auto max-w-5xl py-16">
        <p className="text-sm text-muted-foreground">
          Signed in as {recruiter.email ?? "your recruiter account"}.
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Your jobs will appear here.
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Create a draft job to begin preparing an evaluation plan.
        </p>
      </section>
    </main>
  );
}
