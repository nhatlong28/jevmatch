import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const getCurrentRecruiter = cache(async () => {
  const supabase = await createClient();
  const {
    data,
  } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    return null;
  }

  return {
    email: typeof claims.email === "string" ? claims.email : null,
    id: claims.sub,
  };
});
