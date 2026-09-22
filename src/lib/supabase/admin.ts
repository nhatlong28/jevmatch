import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabasePublicConfig } from "./config";

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_SECRET_KEY.");
  }

  return createClient<Database>(getSupabasePublicConfig().url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
