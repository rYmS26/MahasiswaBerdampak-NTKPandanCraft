import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig } from "./env";

/**
 * Server-only Supabase admin client using SUPABASE_SECRET_KEY (never import in Client Components).
 */
export function createAdminSupabaseClient() {
  const config = getSupabaseAdminConfig();
  if (!config) {
    return null;
  }

  return createClient(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
