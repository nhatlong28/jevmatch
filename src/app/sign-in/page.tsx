import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <section className="w-full max-w-md rounded-xl border bg-surface p-7 shadow-sm sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span aria-hidden="true" className="relative block size-7">
            <span className="absolute top-0 right-0 size-4 rounded-md bg-primary/70" />
            <span className="absolute bottom-0 left-0 size-4 rounded-md bg-primary" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Jev Match</span>
        </div>
        <div className="mb-7 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use the recruiter account provided to you by your administrator.
          </p>
        </div>
        <SignInForm />
      </section>
    </main>
  );
}
