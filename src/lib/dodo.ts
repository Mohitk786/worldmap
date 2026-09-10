import DodoPayments from "dodopayments";

const globalForDodo = globalThis as unknown as { dodo?: DodoPayments };

export function getDodo(): DodoPayments {
  if (!globalForDodo.dodo) {
    const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
    if (!bearerToken) {
      throw new Error(
        "DODO_PAYMENTS_API_KEY is not set. Add your Dodo Payments test-mode API key to .env before using checkout."
      );
    }
    const environment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
    globalForDodo.dodo = new DodoPayments({
      bearerToken,
      environment,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
    });
  }
  return globalForDodo.dodo;
}
