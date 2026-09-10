import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCountryFeatures, countrySlugFor } from "../src/lib/countries";
import { DEFAULT_PRICE_FLOOR } from "../src/lib/pricing";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// The one undisclosed easter egg: a lower price floor than everywhere else
// on the map. Never named in the UI or the rules page — this comment is the
// only place it's written down.
const HIDDEN_LOW_FLOOR_COUNTRY = "Bhutan";
const HIDDEN_FLOOR = 1;

// The opposite of the hidden country: a publicly spotlighted premium
// territory with a much higher floor. Called out on the globe itself (see
// FEATURED_COUNTRY in WorldGlobe.tsx) rather than kept secret.
const FEATURED_COUNTRY = "Antarctica";
const FEATURED_FLOOR = 100;

async function main() {
  const features = getCountryFeatures();
  console.log(`Seeding ${features.length} countries from world-atlas...`);

  for (const feature of features) {
    const name = feature.properties.name;
    const topoId = typeof feature.id === "string" || typeof feature.id === "number" ? String(feature.id) : `name:${countrySlugFor(name)}`;
    const priceFloor = name === HIDDEN_LOW_FLOOR_COUNTRY ? HIDDEN_FLOOR : name === FEATURED_COUNTRY ? FEATURED_FLOOR : DEFAULT_PRICE_FLOOR;

    await db.country.upsert({
      where: { name },
      update: { topoId, priceFloor },
      create: { topoId, name, slug: countrySlugFor(name), priceFloor },
    });
  }

  const count = await db.country.count();
  console.log(`Done. ${count} countries in the database.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
