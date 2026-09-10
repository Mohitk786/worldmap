import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";

const SESSION_COOKIE = "wm_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function fixedLengthHash(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return timingSafeEqual(fixedLengthHash(password), fixedLengthHash(expected));
}

/** Route Handler / Server Action only — mutates cookies. */
export async function createAdminSession(): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.adminSession.create({ data: { token, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

/** Route Handler / Server Action only — mutates cookies. */
export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.adminSession.deleteMany({ where: { token } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const session = await db.adminSession.findUnique({ where: { token } });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { token } }).catch(() => {});
    return false;
  }
  return true;
}
