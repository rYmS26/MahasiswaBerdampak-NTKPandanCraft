import { NextResponse } from "next/server";
import { getSupabaseAdminConfig, getSupabasePublicConfig } from "@/lib/supabase/env";
import { createPublicCatalogClient } from "@/lib/supabase/server";

export async function GET() {
  const pub = getSupabasePublicConfig();
  const admin = getSupabaseAdminConfig();
  let dbReachable = false;

  if (pub) {
    try {
      const supabase = createPublicCatalogClient();
      if (supabase) {
        const { error } = await supabase
          .from("products")
          .select("id", { head: true, count: "exact" })
          .limit(1);
        dbReachable = !error;
      }
    } catch {
      dbReachable = false;
    }
  }

  return NextResponse.json({
    ok: true,
    supabasePublicConfigured: Boolean(pub),
    supabaseOrderPersistenceConfigured: Boolean(admin),
    dbReachable,
  });
}
