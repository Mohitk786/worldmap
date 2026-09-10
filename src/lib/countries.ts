import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import worldAtlas110m from "world-atlas/countries-110m.json";
import { slugify } from "./slugify";

export type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>;

/**
 * The exact same dataset the globe renders client-side (Natural Earth via
 * world-atlas, per worldmap's own disclosed data source) — used at seed time
 * so every DB row's `name` matches a real polygon, and again here for any
 * server code that needs the full feature list (e.g. the seed script).
 * `name` (not the numeric topojson `id`, which three real disputed
 * territories in this dataset don't have) is the stable join key used
 * everywhere.
 */
export function getCountryFeatures(): CountryFeature[] {
  const topology = worldAtlas110m as unknown as Topology;
  const geometries = topology.objects.countries as GeometryCollection;
  const collection = feature(topology, geometries) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;
  return collection.features;
}

export function countrySlugFor(name: string): string {
  return slugify(name);
}
