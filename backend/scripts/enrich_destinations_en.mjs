import "dotenv/config";
import { query } from "../src/db.js";

const COUNTRY_MAP = {
  "Franta": "France",
  "France": "France",
  "Italia": "Italy",
  "Italy": "Italy",
  "Spania": "Spain",
  "Spain": "Spain",
  "Grecia": "Greece",
  "Ellada": "Greece",
  "Hellas": "Greece",
  "Hrvatska": "Croatia",
  "Croatia": "Croatia",
  "Portugal": "Portugal",
  "Deutschland": "Germany",
  "Germania": "Germany",
  "Germany": "Germany",
  "Olanda": "Netherlands",
  "Netherlands": "Netherlands",
  "Austria": "Austria",
  "Ungaria": "Hungary",
  "Hungary": "Hungary",
  "Cehia": "Czech Republic",
  "Czech Republic": "Czech Republic",
  "Danemarca": "Denmark",
  "Denmark": "Denmark",
  "Suedia": "Sweden",
  "Sweden": "Sweden",
  "Elvetia": "Switzerland",
  "Switzerland": "Switzerland",
  "Islanda": "Iceland",
  "Iceland": "Iceland",
  "Irlanda": "Ireland",
  "Ireland": "Ireland",
  "Romania": "Romania"
};

function normalizeCountry(country) {
  if (!country) return null;

  const trimmed = String(country).trim();
  if (!trimmed) return null;

  return COUNTRY_MAP[trimmed] || trimmed;
}

function looksLikeKinds(text) {
  if (!text) return false;

  return (
    text.includes("_") ||
    (text.includes(",") && !text.includes("."))
  );
}

function looksEnglish(text) {
  if (!text) return false;

  return /\b(the|and|is|in|for|with|perfect|known|popular|beautiful|historic|beach|city|ideal|destination|famous|capital|ancient|island|coastal|mountain|culture|architecture)\b/i.test(text);
}

function cleanDescription(description) {
  if (!description) return null;

  const text = String(description).trim();
  if (!text) return null;

  if (looksLikeKinds(text)) return null;

  if (!looksEnglish(text)) return null;

  return text.length > 220 ? text.slice(0, 217) + "..." : text;
}

async function main() {
  console.log("Enrich Destinations -> country_en, description_en");

  const res = await query(`
    SELECT id, country, description
    FROM "Destinations"
    ORDER BY id
  `);

  let updated = 0;

  for (const row of res.rows) {
    const countryEn = normalizeCountry(row.country);
    const descriptionEn = cleanDescription(row.description);

    await query(
      `
      UPDATE "Destinations"
      SET country_en = $1,
          description_en = $2
      WHERE id = $3
      `,
      [countryEn, descriptionEn, row.id]
    );

    updated += 1;
  }

  console.log(`Updated ${updated} destinations.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Enrich failed:", err);
  process.exit(1);
});