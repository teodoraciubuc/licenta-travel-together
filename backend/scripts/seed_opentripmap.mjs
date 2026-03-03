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
  // Orașe Culturale & Istorice
  "Madrid", 
  "Florence", 
  "Venice", 
  "Krakow", 
  "Edinburgh", 
  "Seville",

  // Destinații de Coastă / Plajă
  "Nice", 
  "Dubrovnik", 
  "Santorini", 
  "Palma de Mallorca",

  // Destinații de Munte & Natură
  "Zermatt", 
  "Chamonix", 
  "Interlaken", 
  "Innsbruck", 
  "Reykjavik", 
  "Brasov",

  // Capitale Vibrante / City Break
  "Copenhagen", 
  "Stockholm", 
  "Dublin", 
  "Zurich"
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

async function radiusPlaces({ lon, lat, radius = 20000, limit = 200, kinds = "interesting_places" }) {
  const url =
    `${BASE}/places/radius?radius=${radius}` +
    `&lon=${lon}&lat=${lat}` +
    `&kinds=${encodeURIComponent(kinds)}` +
    `&format=json&limit=${limit}` +
    `&apikey=${API_KEY}`;
  return getJson(url);
}

async function placeDetails(xid) {
  const url = `${BASE}/places/xid/${encodeURIComponent(xid)}?apikey=${API_KEY}`;
  try {
    return await getJson(url);
  } catch {
    return null;
  }
}

async function upsertDestination(d) {
  const name = d.name || null;
  const country = d.address?.country || d.address?.country_code || null;
  const description = d.wikipedia_extracts?.text || d.info?.descr || null;

  const lat = d.point?.lat ?? null;
  const lon = d.point?.lon ?? null;

  const source = "opentripmap";
  const sourceId = d.xid;
  const kinds = d.kinds || null;
  const otmRate = d.rate ?? 0;

  if (!sourceId || !name || lat == null || lon == null) return;

  await query(
    `
    INSERT INTO "Destinations"
      (name, country, description, latitude, longitude, source, source_id, kinds, otm_rate)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (source, source_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      country = EXCLUDED.country,
      description = EXCLUDED.description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      kinds = EXCLUDED.kinds,
      otm_rate = EXCLUDED.otm_rate
    `,
    [name, country, description, lat, lon, source, sourceId, kinds, otmRate]
  );
}

async function main() {
  console.log("Seed OpenTripMap -> Destinations");

  const kinds =
    "interesting_places,cultural,architecture,historic,museums,urban_environment";

  for (const city of CITIES) {
    console.log("City:", city);

    const g = await geoname(city);
    const list = await radiusPlaces({
      lon: g.lon,
      lat: g.lat,
      radius: 20000,
      limit: 200,
      kinds,
    });

    console.log(`  found: ${list.length}`);

    for (const p of list) {
      if (!p?.xid) continue;
      const det = await placeDetails(p.xid);
      if (det) await upsertDestination(det);
      await sleep(120);
    }

    await sleep(500);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});