import fs from "fs";
import readline from "readline";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("backend/.env") });
import { query } from "../src/db.js";

const FILE = path.resolve("cities15000.txt");

const EUROPEAN_COUNTRIES = {
  AD: "Andorra",
  AL: "Albania",
  AT: "Austria",
  BA: "Bosnia and Herzegovina",
  BE: "Belgium",
  BG: "Bulgaria",
  BY: "Belarus",
  CH: "Switzerland",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DE: "Germany",
  DK: "Denmark",
  EE: "Estonia",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  GR: "Greece",
  HR: "Croatia",
  HU: "Hungary",
  IE: "Ireland",
  IS: "Iceland",
  IT: "Italy",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  MC: "Monaco",
  MD: "Moldova",
  ME: "Montenegro",
  MK: "North Macedonia",
  MT: "Malta",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  SE: "Sweden",
  SI: "Slovenia",
  SK: "Slovakia",
  SM: "San Marino",
  UA: "Ukraine",
  VA: "Vatican City",
};

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function pick3Unique(arr) {
  const picked = new Set();
  while (picked.size < 3) {
    const idx = Math.floor(Math.random() * arr.length);
    picked.add(arr[idx]);
  }
  return [...picked];
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error("Fisier lipsa:", FILE);
    process.exit(1);
  }

  await query(`DELETE FROM "Destination_Tags"`);
  await query(`DELETE FROM "Destinations"`);

  const tagRows = await query(`SELECT id FROM "Tags" ORDER BY id`);
  const tagIds = tagRows.rows.map((r) => r.id);

  if (tagIds.length < 3) {
    throw new Error(`Ai doar ${tagIds.length} tag-uri in tabela "Tags". Trebuie minim 3.`);
  }

  const fileStream = fs.createReadStream(FILE, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const cities = [];

  for await (const line of rl) {
    if (!line) continue;
    const parts = line.split("\t");
    if (parts.length < 16) continue;

    const geonameId = parts[0];
    const name = parts[2] || parts[1];
    const lat = safeNum(parts[4]);
    const lon = safeNum(parts[5]);
    const countryCode = parts[8];
    const population = parseInt(parts[14], 10) || 0;

    if (!geonameId || !name) continue;
    if (lat == null || lon == null) continue;

    const countryEn = EUROPEAN_COUNTRIES[countryCode];
    if (!countryEn) continue;

    cities.push({
      geonameId,
      name,
      country_code: countryCode,
      country_en: countryEn,
      lat,
      lon,
      population,
    });
  }

  cities.sort((a, b) => (b.population || 0) - (a.population || 0));
  const top500 = cities.slice(0, 500);

  let saved = 0;

  for (const city of top500) {
    const res = await query(
      `
      INSERT INTO "Destinations"
        (name, country, latitude, longitude, source, source_id, country_en)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (source, source_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        country_en = EXCLUDED.country_en
      RETURNING id
      `,
      [
        city.name,
        city.country_code,
        city.lat,
        city.lon,
        "geonames",
        String(city.geonameId),
        city.country_en,
      ]
    );

    const cityId = res.rows[0].id;
    const tags = pick3Unique(tagIds);

    for (const tagId of tags) {
      await query(
        `INSERT INTO "Destination_Tags" (destination_id, tag_id) VALUES ($1,$2)`,
        [cityId, tagId]
      );
    }

    saved++;
  }

  console.log(`Salvate ${saved} orase.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});