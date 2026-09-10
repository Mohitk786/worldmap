"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/lib/site-config";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed.");
      setSubmitting(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs rounded-2xl border border-panel-border bg-panel p-6">
        <h1 className="font-display text-xl text-gold-soft">{siteConfig.name} admin</h1>
        <label className="mt-4 flex flex-col gap-1 text-xs text-muted">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="rounded-lg border border-panel-border bg-ink-deep px-3 py-2 text-sm text-foreground outline-none focus:border-gold-soft"
          />
        </label>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="mt-4 w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink-deep disabled:opacity-50">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
