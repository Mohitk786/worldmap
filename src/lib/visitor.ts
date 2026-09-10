import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

const VISITOR_COOKIE = "wm_visitor";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getVisitorId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VISITOR_COOKIE)?.value ?? null;
}

/** Only callable from a Route Handler or Server Action — cookies() is read-only elsewhere. */
export async function getOrCreateVisitorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const id = randomBytes(16).toString("hex");
  store.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return id;
}
