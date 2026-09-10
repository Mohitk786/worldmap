import { NextResponse } from "next/server";
import { getDodo } from "@/lib/dodo";
import { db } from "@/lib/db";
import { applySucceededCheckoutSession, flagListingForDispute, markCheckoutFailed } from "@/lib/payment-processing";

function metadataCheckoutId(metadata: Record<string, string | number | boolean>): string | undefined {
  const value = metadata.checkoutId;
  return typeof value === "string" ? value : undefined;
}

// Dodo requires the raw request body for Standard Webhooks signature
// verification, so this route must never run any body-parsing middleware
// ahead of it.
export async function POST(request: Request) {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_SECRET) {
    console.error("DODO_PAYMENTS_WEBHOOK_SECRET is not set — refusing to process webhook.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const webhookId = request.headers.get("webhook-id");
  if (!webhookId) {
    return NextResponse.json({ error: "Missing signature headers." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = getDodo().webhooks.unwrap(rawBody, { headers: Object.fromEntries(request.headers) });
  } catch (err) {
    console.error("Dodo webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency: every event is keyed by its unique `webhook-id` header. An
  // already-APPLIED event is a true duplicate delivery and is skipped: but
  // an event that previously failed mid-processing must still be retried,
  // since Dodo retrying on our 500 is exactly what lets us self-heal without
  // a separate reconciliation pass.
  const existingEvent = await db.paymentEvent.findUnique({ where: { eventId: webhookId } });
  if (existingEvent?.status === "APPLIED" || existingEvent?.status === "DUPLICATE_IGNORED") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (!existingEvent) {
    await db.paymentEvent.create({
      data: { provider: "dodo", eventId: webhookId, eventType: event.type, rawPayload: JSON.parse(JSON.stringify(event)) },
    });
  }

  try {
    switch (event.type) {
      case "payment.succeeded": {
        const payment = event.data;
        await applySucceededCheckoutSession({
          checkoutId: metadataCheckoutId(payment.metadata),
          dodoPaymentId: payment.payment_id,
        });
        break;
      }
      case "payment.failed":
      case "payment.cancelled": {
        const checkoutId = metadataCheckoutId(event.data.metadata);
        if (checkoutId) await markCheckoutFailed(checkoutId);
        break;
      }
      case "refund.succeeded":
      case "dispute.opened": {
        await flagListingForDispute(event.data.payment_id, event.type === "refund.succeeded" ? "refund" : "chargeback");
        break;
      }
      default:
        break;
    }

    await db.paymentEvent.update({ where: { eventId: webhookId }, data: { status: "APPLIED", processedAt: new Date() } });
  } catch (err) {
    console.error("Failed to process Dodo webhook event", webhookId, err);
    await db.paymentEvent
      .update({ where: { eventId: webhookId }, data: { status: "REJECTED", error: err instanceof Error ? err.message : "unknown error" } })
      .catch(() => {});
    // Return 500 so Dodo retries — the PaymentEvent row (and the
    // reconciliation job) means a retry can never double-apply the bid.
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
