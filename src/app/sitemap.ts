import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticRoutes = ["", "/rules", "/about", "/faq", "/terms", "/privacy"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "hourly" as const,
    priority: path === "" ? 1 : 0.5,
  }));

  const owners = await db.listing.findMany({
    where: { status: "ACTIVE" },
    distinct: ["normalizedKey"],
    select: { normalizedKey: true },
    take: 5000,
  });

  const pinRoutes = owners.map((o) => ({
    url: `${siteUrl}/pin/${encodeURIComponent(o.normalizedKey)}`,
    changeFrequency: "daily" as const,
    priority: 0.3,
  }));

  return [...staticRoutes, ...pinRoutes];
}
