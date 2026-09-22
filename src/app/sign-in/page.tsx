import { JevMatchBrand } from "@/components/jev-match-brand";

import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5 sm:p-8">
      <section className="w-full max-w-md rounded-[14px] border bg-surface p-6 sm:p-8">
        <div className="mb-10">
          <JevMatchBrand />
        </div>
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Sign in</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use the recruiter account provided to you by your administrator.
          </p>
        </div>
        <SignInForm />
      </section>
    </main>
  );
}
