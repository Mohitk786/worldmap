import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const VALID_STATUSES = ["ACTIVE", "UNDER_REVIEW", "REMOVED"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const listing = await db.listing.update({ where: { id }, data: { status } }).catch(() => null);
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  return NextResponse.json({ ok: true, listing });
}
