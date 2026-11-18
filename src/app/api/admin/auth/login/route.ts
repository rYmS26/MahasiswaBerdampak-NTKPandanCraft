import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  validateAdminCredentials,
} from "@/lib/admin-auth";
import {
  checkRateLimit,
  getClientIp,
  sanitizePlainText,
} from "@/lib/security";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `admin_login:${clientIp}`,
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    minIntervalMs: 1500, // 1.5s minimum interval
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          rateLimit.reason ||
          "Terlalu banyak percobaan login. Silakan tunggu beberapa menit lagi.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec) },
      },
    );
  }

  try {
    const body = await request.json();
    const email = sanitizePlainText(body?.email, 120);
    const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email/Username dan Kata Sandi wajib diisi." },
        { status: 400 },
      );
    }

    const isValid = validateAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Email/Username atau Kata Sandi salah." },
        { status: 401 },
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
      { status: 500 },
    );
  }
}
