"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

export function SignInForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await createClient().auth.signInWithPassword({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (error) {
      setErrorMessage("We could not sign you in. Check your email and password.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/jobs");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Work email
        </label>
        <Input autoComplete="email" className="h-11 rounded-xl" id="email" name="email" required type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input
          autoComplete="current-password"
          className="h-11 rounded-xl"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
