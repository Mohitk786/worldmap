import { NextResponse } from "next/server";
import { checkAdminPassword, createAdminSession } from "@/lib/admin-auth";
import { getClientIp, hashIp, rateLimit } from "@/lib/abuse";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`admin-login:${hashIp(ip)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !checkAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
