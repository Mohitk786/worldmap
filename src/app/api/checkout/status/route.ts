import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutId = searchParams.get("checkoutId");
  if (!checkoutId) return NextResponse.json({ error: "Missing checkoutId." }, { status: 400 });

  const checkout = await db.checkout.findUnique({
    where: { id: checkoutId },
    select: { status: true, targetDisplayName: true, targetNormalizedKey: true, amount: true, targetCountryId: true },
  });
  if (!checkout) return NextResponse.json({ error: "Checkout not found." }, { status: 404 });

  const country = await db.country.findUnique({ where: { id: checkout.targetCountryId }, select: { name: true, slug: true } });

  return NextResponse.json({
    status: checkout.status,
    displayName: checkout.targetDisplayName,
    normalizedKey: checkout.targetNormalizedKey,
    amount: checkout.amount,
    country,
  });
}
