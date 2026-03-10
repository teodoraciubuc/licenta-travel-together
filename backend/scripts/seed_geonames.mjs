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

// Tag IDs (matches DB):
// 1=Munte, 2=Plaja/Litoral, 3=Oras istoric, 4=Natura/Parcuri, 5=Lacuri/Cascade
// 6=Soare si caldura, 7=Zapada si iarna, 8=Clima temperata, 9=Vizitare muzee
// 10=Drumetii/Hiking, 11=Shopping, 12=Gastronomie, 13=Sporturi de apa, 14=Viata de noapte

// Tari montane
const MOUNTAIN_COUNTRIES = new Set(["AT", "CH", "LI", "AD", "SI", "SK"]);

// Tari cu litoral relevant
const COASTAL_COUNTRIES = new Set(["HR", "GR", "ES", "IT", "PT", "MT", "CY", "ME", "AL", "MC", "FR", "TR"]);

// Tari nordice/scandinave
const NORDIC_COUNTRIES = new Set(["NO", "SE", "FI", "IS", "DK"]);

// Tari cu climat cald
const WARM_COUNTRIES = new Set(["ES", "IT", "GR", "PT", "CY", "MT", "TR", "MC"]);

// Tari cu clima temperata predominant
const TEMPERATE_COUNTRIES = new Set(["DE", "FR", "GB", "BE", "NL", "LU", "CZ", "HU", "PL", "SK", "RO", "BG", "RS", "BA", "MK", "MD", "UA", "BY", "RU", "LT", "LV", "EE", "IE"]);

// Tari cu gastronomie recunoscuta
const GASTRONOMY_COUNTRIES = new Set(["FR", "IT", "ES", "PT", "GR"]);

// Orase mari (populatie > 500000) → shopping + viata de noapte
// Orase istorice cunoscute
const HISTORIC_CITIES = new Set([
  "Rome", "Roma", "Athens", "Athinai", "Prague", "Praha", "Vienna", "Wien",
  "Budapest", "Krakow", "Krakow", "Dubrovnik", "Florence", "Firenze",
  "Venice", "Venezia", "Lisbon", "Lisboa", "Seville", "Sevilla",
  "Bruges", "Tallinn", "Riga", "Vilnius", "Valletta", "Edinburgh",
  "Ghent", "Siena", "Kotor", "Plovdiv", "Ohrid", "Mostar", "Brasov",
  "Sinaia", "Sibiu", "Cluj-Napoca", "Sarajevo"
]);

function assignTags(city) {
  const cc = city.country_code;
  const name = city.name;
  const pop = city.population || 0;
  const lat = city.lat;

  const tags = new Set();

  // Munte
  if (MOUNTAIN_COUNTRIES.has(cc)) tags.add(1);
  if (["NO", "IS", "AL", "BA", "ME", "MK", "RO", "BG"].includes(cc)) tags.add(1);

  // Plaja / Litoral
  if (COASTAL_COUNTRIES.has(cc)) tags.add(2);

  // Oras istoric
  if (HISTORIC_CITIES.has(name)) tags.add(3);

  // Natura / Parcuri nationale
  if (NORDIC_COUNTRIES.has(cc)) tags.add(4);
  if (MOUNTAIN_COUNTRIES.has(cc)) tags.add(4);
  if (["IS", "IE", "RO", "BG", "BA", "AL"].includes(cc)) tags.add(4);

  // Lacuri / Cascade
  if (["CH", "AT", "NO", "FI", "SE", "IS", "SI", "IT"].includes(cc)) tags.add(5);

  // Soare si caldura
  if (WARM_COUNTRIES.has(cc)) tags.add(6);
  if (lat < 45 && COASTAL_COUNTRIES.has(cc)) tags.add(6);

  // Zapada si iarna
  if (MOUNTAIN_COUNTRIES.has(cc)) tags.add(7);
  if (NORDIC_COUNTRIES.has(cc)) tags.add(7);
  if (["RU", "BY", "UA", "PL", "CZ", "SK", "RO", "BG"].includes(cc) && lat > 50) tags.add(7);

  // Clima temperata
  if (TEMPERATE_COUNTRIES.has(cc) && !WARM_COUNTRIES.has(cc)) tags.add(8);

  // Vizitare muzee (orase mari sau istorice)
  if (pop > 300000 || HISTORIC_CITIES.has(name)) tags.add(9);

  // Drumetii / Hiking
  if (MOUNTAIN_COUNTRIES.has(cc)) tags.add(10);
  if (NORDIC_COUNTRIES.has(cc)) tags.add(10);
  if (["IS", "IE", "RO", "BA", "AL", "ME", "MK"].includes(cc)) tags.add(10);

  // Shopping (orase mari)
  if (pop > 500000) tags.add(11);

  // Gastronomie
  if (GASTRONOMY_COUNTRIES.has(cc)) tags.add(12);

  // Sporturi de apa
  if (COASTAL_COUNTRIES.has(cc)) tags.add(13);
  if (["FI", "SE", "NO", "IS"].includes(cc)) tags.add(13);

  // Viata de noapte (orase mari)
  if (pop > 400000) tags.add(14);

  const tagArray = [...tags];

  // Fiecare oras trebuie sa aiba exact 3 taguri
  if (tagArray.length >= 3) {
    // Alege primele 3 cele mai relevante (ordinea din Set e ordinea insertiei = prioritate)
    return tagArray.slice(0, 3);
  }

  // Daca are mai putin de 3 taguri, completeaza cu fallback-uri logice
  const fallbacks = [8, 3, 9, 4, 11]; // clima temperata, oras istoric, muzee, natura, shopping
  for (const fb of fallbacks) {
    if (tagArray.length >= 3) break;
    if (!tags.has(fb)) {
      tagArray.push(fb);
      tags.add(fb);
    }
  }

  return tagArray.slice(0, 3);
}

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error("Fisier lipsa:", FILE);
    process.exit(1);
  }

  await query(`DELETE FROM "Destination_Tags"`);
  await query(`DELETE FROM "Destinations"`);

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
    const tags = assignTags(city);

    for (const tagId of tags) {
      await query(
        `INSERT INTO "Destination_Tags" (destination_id, tag_id) VALUES ($1,$2)`,
        [cityId, tagId]
      );
    }

    saved++;
  }

  console.log(`Salvate ${saved} orase cu taguri geografice.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
