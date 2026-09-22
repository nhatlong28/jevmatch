import { MailIcon, ShieldCheckIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCurrentRecruiter } from "@/lib/auth/recruiter";

export default async function SettingsPage() {
  const recruiter = await getCurrentRecruiter();
  const email = recruiter?.email ?? "Signed-in account";

  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b pb-7">
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">Settings</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-muted-foreground">
          Your recruiter account is managed by your administrator. Job access and
          review data remain private to this account.
        </p>
      </header>

      <section className="mt-8 rounded-[14px] border bg-surface" aria-labelledby="account-title">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <Avatar size="lg">
            <AvatarFallback>{email.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold" id="account-title">Recruiter account</h2>
              <Badge variant="success">Provisioned</Badge>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MailIcon aria-hidden="true" className="size-4" />
              <span className="truncate">{email}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t bg-muted/40 p-5 text-sm text-muted-foreground sm:p-6">
          <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          <p>
            This account can access only its own Jobs, applications, and original
            CV links. Contact your administrator to change account details.
          </p>
        </div>
      </section>
    </div>
  );
}
