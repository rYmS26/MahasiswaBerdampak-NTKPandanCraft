import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  return NextResponse.json({
    ok: true,
    authenticated: isAuth,
  });
}
