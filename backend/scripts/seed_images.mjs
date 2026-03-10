import "dotenv/config";
import { query } from "../src/db.js";

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
if (!PIXABAY_API_KEY) {
  console.error("Lipseste PIXABAY_API_KEY in backend/.env");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPixabayImage(cityName) {
  const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(cityName + " city")}&image_type=photo&category=travel&per_page=3&safesearch=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`);
  const data = await res.json();
  if (data.hits && data.hits.length > 0) {
    return data.hits[0].webformatURL;
  }
  return null;
}

async function main() {
  console.log("Cautam poze pe Pixabay pentru orase...");

  // Incearca intai Wikipedia, apoi Pixabay ca fallback
  const res = await query(`
    SELECT id, name
    FROM "Destinations"
    WHERE image_url IS NULL OR image_url = '' OR image_url LIKE '%picsum%' OR image_url LIKE '%unsplash%'
    ORDER BY id
  `);

  console.log(`Orase de procesat: ${res.rows.length}`);

  let updated = 0;
  let failed = 0;

  for (const row of res.rows) {
    try {
      // Incearca Wikipedia intai
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(row.name)}`;
      const wikiRes = await fetch(wikiUrl);

      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData.originalimage?.source) {
          await query(`UPDATE "Destinations" SET image_url = $1 WHERE id = $2`, [wikiData.originalimage.source, row.id]);
          updated++;
          console.log(`✅ Wikipedia: ${row.name}`);
          await sleep(150);
          continue;
        }
      }

      // Fallback Pixabay
      const pixabayUrl = await getPixabayImage(row.name);
      if (pixabayUrl) {
        await query(`UPDATE "Destinations" SET image_url = $1 WHERE id = $2`, [pixabayUrl, row.id]);
        updated++;
        console.log(`✅ Pixabay: ${row.name}`);
      } else {
        // Fallback final — picsum cu id unic
        const picsumUrl = `https://picsum.photos/seed/${row.id}/600/400`;
        await query(`UPDATE "Destinations" SET image_url = $1 WHERE id = $2`, [picsumUrl, row.id]);
        console.log(`⚠️ Picsum fallback: ${row.name}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ EROARE: ${row.name} — ${err.message}`);
      failed++;
    }

    await sleep(200);
  }

  console.log(`\nGata. Actualizate: ${updated}, fallback: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
