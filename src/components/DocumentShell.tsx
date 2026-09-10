import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site-config";

const NAV = [
  { href: "/", label: "The map" },
  { href: "/rules", label: "Rules" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function DocumentShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <Link href="/" className="font-display text-xl text-gold-soft">
          {siteConfig.name}
        </Link>
        <nav className="flex gap-5 text-sm text-muted">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 sm:px-10">
        <article className="rounded-2xl border border-panel-border bg-parchment px-6 py-10 text-parchment-ink sm:px-10 [&_a]:text-parchment-ink [&_a]:underline [&_a]:underline-offset-2 [&_h1]:font-display [&_h1]:text-3xl [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-xl [&_p]:mt-3 [&_p]:leading-relaxed [&_li]:mt-2 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </article>
      </main>

      <footer className="px-6 pb-10 text-center text-xs text-muted sm:px-10">
        <p>
          {siteConfig.name} — {siteConfig.tagline}
        </p>
        <p className="mt-1">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  );
}
