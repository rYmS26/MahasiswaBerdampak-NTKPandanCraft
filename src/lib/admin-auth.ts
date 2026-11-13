import { cookies } from "next/headers";
import crypto from "crypto";

const DEFAULT_ADMIN_EMAIL = "admin@pandancraft.com";
const DEFAULT_ADMIN_PASSWORD = "adminpandan2026";
export const ADMIN_COOKIE_NAME = "admin_session_token";

function getAdminConfig() {
  const email = (process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.ADMIN_SESSION_SECRET ||
    "ciamis-pandan-craft-admin-secure-fallback-salt-2026";

  return { email, password, secretKey };
}

export function validateAdminCredentials(emailInput: string, passwordInput: string): boolean {
  const { email, password } = getAdminConfig();
  const cleanedEmail = (emailInput || "").trim().toLowerCase();
  const cleanedPassword = passwordInput || "";

  // Allow either full email (admin@pandancraft.com) or simple username "admin"
  const isUsernameMatch =
    cleanedEmail === email ||
    cleanedEmail === "admin" ||
    cleanedEmail === email.split("@")[0];

  const isPasswordMatch = cleanedPassword === password;

  return isUsernameMatch && isPasswordMatch;
}

export function createAdminToken(email: string): string {
  const { secretKey } = getAdminConfig();
  const timestamp = Date.now();
  const data = `${email}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secretKey).update(data).digest("hex");
  return `${data}:${hmac}`;
}

export function verifyAdminToken(token: string | null | undefined): { valid: boolean; email?: string } {
  if (!token) return { valid: false };

  try {
    const parts = token.split(":");
    if (parts.length !== 3) return { valid: false };

    const [email, timestampStr, hmacReceived] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Max session age: 7 days
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
      return { valid: false };
    }

    const { secretKey } = getAdminConfig();
    const data = `${email}:${timestamp}`;
    const expectedHmac = crypto.createHmac("sha256", secretKey).update(data).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(hmacReceived), Buffer.from(expectedHmac))) {
      return { valid: true, email };
    }
  } catch {
    return { valid: false };
  }

  return { valid: false };
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const { valid } = verifyAdminToken(token);
  return valid;
}
