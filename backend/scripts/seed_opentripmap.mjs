// backend/scripts/seed_opentripmap.mjs
import "dotenv/config";
import { query } from "../src/db.js";

const API_KEY = process.env.OPENTRIPMAP_API_KEY;
if (!API_KEY) {
  console.error("Lipseste OPENTRIPMAP_API_KEY in backend/.env");
  process.exit(1);
}

const BASE = "https://api.opentripmap.com/0.1/en";
const CITIES = [
  "Paris",
  "Rome",
  "Barcelona",
  "Vienna",
  "Prague",
  "Budapest",
  "Amsterdam",
  "Berlin",
  "Lisbon",
  "Athens",
  "Madrid",
  "Florence",
  "Venice",
  "Krakow",
  "Edinburgh",
  "Seville",
  "Nice",
  "Dubrovnik",
  "Santorini",
  "Palma de Mallorca",
  "Zermatt",
  "Chamonix",
  "Interlaken",
  "Innsbruck",
  "Reykjavik",
  "Brasov",
  "Copenhagen",
  "Stockholm",
  "Dublin",
  "Zurich",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} for ${url}\n${txt}`);
  }
  return r.json();
}

async function geoname(city) {
  const url = `${BASE}/places/geoname?name=${encodeURIComponent(city)}&apikey=${API_KEY}`;
  return getJson(url);
}

function normalizeCountry(g) {
  const country = g?.country || (g?.country_code ? g.country_code.toUpperCase() : null);
  const countryEn = g?.country || null; 
  return { country, countryEn };
}

async function upsertCity(cityName, g) {
  const name = g?.name || cityName || null;
  const { country, countryEn } = normalizeCountry(g);

  const lat = g?.lat ?? null;
  const lon = g?.lon ?? null;

  const source = "opentripmap_geoname";
  const sourceId =
    g?.geoname_id != null
      ? String(g.geoname_id)
      : `${name || ""}|${country || ""}|${lat ?? ""},${lon ?? ""}`.trim();

  // Pentru orase nu ai description/kinds/rate
  const description = null;
  const kinds = null;
  const otmRate = 0;

  // Pastrezi coloanele *_en (ai deja in DB)
  const descriptionEn = null;

  if (!name || lat == null || lon == null || !sourceId) return false;

  await query(
    `
    INSERT INTO "Destinations"
      (name, country, description, latitude, longitude, source, source_id, kinds, otm_rate, country_en, description_en)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (source, source_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      country = EXCLUDED.country,
      description = EXCLUDED.description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      kinds = EXCLUDED.kinds,
      otm_rate = EXCLUDED.otm_rate,
      country_en = EXCLUDED.country_en,
      description_en = EXCLUDED.description_en
    `,
    [
      name,
      country,
      description,
      lat,
      lon,
      source,
      sourceId,
      kinds,
      otmRate,
      countryEn,
      descriptionEn,
    ]
  );

  return true;
}

async function main() {
  console.log("Seed OpenTripMap (geoname cities) -> Destinations");

  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (const city of CITIES) {
    console.log("City:", city);

    try {
      const g = await geoname(city);
      const ok = await upsertCity(city, g);

      if (ok) {
        saved++;
        console.log("  saved:", g?.name || city);
      } else {
        skipped++;
        console.log("  skipped (missing name/lat/lon/sourceId)");
      }
    } catch (e) {
      failed++;
      console.log("  failed:", e?.message || e);
    }

    await sleep(180);
  }

  console.log(`Done. saved=${saved}, skipped=${skipped}, failed=${failed}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});