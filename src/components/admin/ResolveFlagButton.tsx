"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResolveFlagButton({ flagId }: { flagId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch(`/api/admin/moderation/${flagId}`, { method: "PATCH" });
        router.refresh();
      }}
      className="rounded-lg border border-panel-border px-3 py-1.5 text-xs text-foreground hover:border-gold-soft disabled:opacity-50"
    >
      Mark resolved
    </button>
  );
}
