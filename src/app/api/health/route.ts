import { NextResponse } from "next/server";
import { getSupabaseAdminConfig, getSupabasePublicConfig } from "@/lib/supabase/env";
import { createPublicCatalogClient } from "@/lib/supabase/server";

export async function GET() {
  const pub = getSupabasePublicConfig();
  const admin = getSupabaseAdminConfig();
  let dbReachable = false;
  let productsCount = 0;
  let dbError: string | null = null;

  const projectRef = pub?.url
    ? pub.url.replace(/^https?:\/\//, "").split(".")[0]
    : null;

  if (pub) {
    try {
      const supabase = createPublicCatalogClient();
      if (supabase) {
        const { count, error } = await supabase
          .from("products")
          .select("id", { head: true, count: "exact" })
          .limit(1);
        dbReachable = !error;
        productsCount = count ?? 0;
        if (error) {
          dbError = error.message;
        }
      }
    } catch (err: unknown) {
      dbReachable = false;
      dbError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  return NextResponse.json({
    ok: true,
    activeProjectRef: projectRef,
    supabaseUrl: pub?.url || null,
    supabasePublicConfigured: Boolean(pub),
    supabaseOrderPersistenceConfigured: Boolean(admin),
    dbReachable,
    productsCount,
    dbError,
  });
}
