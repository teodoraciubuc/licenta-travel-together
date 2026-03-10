import "dotenv/config";
import { query } from "../src/db.js";

async function main() {
  console.log("Cautam poze pe Wikipedia pentru orase...");

  const res = await query(`
    SELECT id, name
    FROM "Destinations"
    WHERE image_url IS NULL OR image_url = ''
  `);

  let updated = 0;

  for (const row of res.rows) {
    try {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(row.name)}`;
  const req = await fetch(url);
  
  if (req.ok) {
    const data = await req.json();
    if (data.originalimage && data.originalimage.source) {
      await query(`UPDATE "Destinations" SET image_url = $1 WHERE id = $2`, [data.originalimage.source, row.id]);
      updated++;
      console.log(`✅ OK: Poza gasita pentru ${row.name}`);
    } else {
      console.log(`⚠️ LIPSA: ${row.name} are pagina, dar nu are poza.`);
    }
  } else {
    console.log(`❌ EROARE 404: Wikipedia nu a gasit orasul "${row.name}".`);
  }
} catch (err) {
  console.log(`🔥 EROARE RETEA: Nu pot accesa API-ul pentru ${row.name}`);
}

    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`Gata. Am gasit si salvat poze pentru ${updated} orase.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});