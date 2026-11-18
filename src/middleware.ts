import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session_token";
const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionSecret(): string {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.ADMIN_SESSION_SECRET ||
    "ciamis-pandan-craft-admin-secure-fallback-salt-2026"
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyAdminTokenEdge(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [email, timestampStr, hmacReceived] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (!email || isNaN(timestamp) || Date.now() - timestamp > MAX_SESSION_AGE_MS) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const secret = getSessionSecret();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const payload = encoder.encode(`${email}:${timestamp}`);
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, payload);
    const expectedHmac = bufferToHex(signature);

    return timingSafeHexEqual(hmacReceived.toLowerCase(), expectedHmac.toLowerCase());
  } catch {
    return false;
  }
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  const isPublicAdminAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/api/admin/auth/login" ||
    pathname === "/api/admin/auth/logout";

  if ((isAdminPage || isAdminApi) && !isPublicAdminAuthRoute) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = await verifyAdminTokenEdge(token);

    if (!isValid) {
      if (isAdminApi) {
        const res = NextResponse.json(
          {
            ok: false,
            error: "Akses ditolak. Sesi admin tidak valid atau telah berakhir.",
          },
          { status: 401 },
        );
        return applySecurityHeaders(res);
      }

      const loginUrl = new URL("/admin/login", request.url);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|katalog/|logo/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
