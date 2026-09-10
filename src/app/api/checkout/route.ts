import { NextResponse } from "next/server";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { CheckoutRequestSchema, createCheckoutSession, CheckoutRequestError } from "@/lib/checkout";
import { getClientIp, hashIp, rateLimit } from "@/lib/abuse";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`checkout:${hashIp(ip)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again in a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const visitorId = await getOrCreateVisitorId();
    const result = await createCheckoutSession(parsed.data, visitorId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CheckoutRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Checkout failed", err);
    return NextResponse.json({ error: "Something went wrong starting checkout." }, { status: 500 });
  }
}
