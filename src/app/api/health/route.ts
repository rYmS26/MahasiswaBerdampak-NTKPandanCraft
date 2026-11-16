import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminConfig, getSupabasePublicConfig } from "@/lib/supabase/env";
import { createPublicCatalogClient } from "@/lib/supabase/server";

export async function GET() {
  const isAdmin = await isAuthenticatedAdmin();
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

  // Untuk pengunjung publik, jangan pernah menampilkan URL database, project ref, atau detail internal
  if (!isAdmin) {
    return NextResponse.json({
      ok: true,
      status: dbReachable ? "healthy" : "fallback",
    });
  }

  const projectRef = pub?.url
    ? pub.url.replace(/^https?:\/\//, "").split(".")[0]
    : null;

  return NextResponse.json({
    ok: true,
    activeProjectRef: projectRef,
    supabasePublicConfigured: Boolean(pub),
    supabaseOrderPersistenceConfigured: Boolean(admin),
    dbReachable,
  });
}
