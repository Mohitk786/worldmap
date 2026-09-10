import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const flag = await db.moderationFlag.update({ where: { id }, data: { resolvedAt: new Date() } }).catch(() => null);
  if (!flag) return NextResponse.json({ error: "Flag not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
