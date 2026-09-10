import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { SuccessStatus } from "./SuccessStatus";

export default async function SuccessPage({ searchParams }: PageProps<"/success">) {
  const params = await searchParams;
  const checkoutId = typeof params.checkoutId === "string" ? params.checkoutId : null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <Link href="/" className="font-display text-2xl text-gold-soft">
        {siteConfig.name}
      </Link>
      {checkoutId ? <SuccessStatus checkoutId={checkoutId} /> : <p className="text-muted">Missing checkout reference.</p>}
    </div>
  );
}
