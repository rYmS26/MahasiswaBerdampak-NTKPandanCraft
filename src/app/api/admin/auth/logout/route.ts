import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
    return NextResponse.json({ ok: true, message: "Berhasil keluar." });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gagal memproses logout." },
      { status: 500 }
    );
  }
}
