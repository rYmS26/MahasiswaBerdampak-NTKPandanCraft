import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "");
    const password = String(body.password || "");

    const isValid = validateAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Email/Username atau Kata Sandi salah." },
        { status: 401 }
      );
    }

    const token = createAdminToken(email);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({ ok: true, message: "Login berhasil." });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan saat memproses login." },
      { status: 500 }
    );
  }
}
