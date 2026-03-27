const pool = require("../db");

const OTM_API_KEY = process.env.OPENTRIPMAP_API_KEY;
const OTM_BASE = "https://api.opentripmap.com/0.1/en";

const TAG_TO_KINDS = {
  1: "natural",
  2: "beaches",
  3: "historic",
  4: "natural",
  5: "natural,water",
  9: "museums",
  10: "natural",
  11: "shops",
  12: "foods",
  13: "sport,water",
  14: "amusements",
  18: "amusements",
};

function getUserId(req) {
  return req.user?.userId || req.userId || req.user?.id;
}

async function createTrip(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Eroare de autentificare." });
    }

    const { name, destination, startDate, endDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name este obligatoriu." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate si endDate sunt obligatorii." });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "endDate trebuie sa fie dupa startDate." });
    }

    const result = await pool.query(
      `
      INSERT INTO "Itineraries" (user_id, title, destination, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        user_id,
        title AS name,
        destination,
        start_date AS "startDate",
        end_date AS "endDate",
        created_at
      `,
      [userId, name.trim(), destination?.trim() || "", startDate, endDate]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Eroare interna server.", details: error.message });
  }
}

async function getTripById(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const tripResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        title AS name,
        destination,
        start_date AS "startDate",
        end_date AS "endDate",
        created_at
      FROM "Itineraries"
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Itinerariul nu a fost gasit." });
    }

    const trip = tripResult.rows[0];

    return res.json({
      ...trip,
      stops: [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Eroare interna server.", details: error.message });
  }
}

async function getRecommendations(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const tripResult = await pool.query(
      `SELECT id, destination FROM "Itineraries" WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Itinerariul nu a fost gasit." });
    }

    const rawDestination = tripResult.rows[0].destination;
    if (!rawDestination || !rawDestination.trim()) {
      return res.status(400).json({ message: "Itinerarul nu are o destinatie setata." });
    }

    const cityName = rawDestination.split(",")[0].trim();

    const destResult = await pool.query(
      `
      SELECT latitude, longitude
      FROM "Destinations"
      WHERE LOWER(name) = LOWER($1)
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      LIMIT 1
      `,
      [cityName]
    );

    if (destResult.rows.length === 0) {
      return res.status(404).json({
        message: `Nu am gasit coordonate pentru "${cityName}". Asigura-te ca orasul exista in baza de date.`,
      });
    }

    const { latitude, longitude } = destResult.rows[0];

    const prefsResult = await pool.query(
      `SELECT tag_id FROM "User_Preferences" WHERE user_id = $1 ORDER BY score DESC`,
      [userId]
    );

    const kindsSet = new Set();
    for (const row of prefsResult.rows) {
      const mapped = TAG_TO_KINDS[row.tag_id];
      if (mapped) {
        mapped.split(",").forEach((k) => kindsSet.add(k.trim()));
      }
    }
    const kinds = kindsSet.size > 0 ? [...kindsSet].join(",") : "historic,museums,natural";

    if (!OTM_API_KEY) {
      return res.status(500).json({ message: "OPENTRIPMAP_API_KEY lipseste din .env." });
    }

    const radius = 5000;
    const otmUrl =
      `${OTM_BASE}/places/radius` +
      `?radius=${radius}` +
      `&lon=${longitude}` +
      `&lat=${latitude}` +
      `&kinds=${kinds}` +
      `&rate=3` +
      `&format=json` +
      `&limit=10` +
      `&apikey=${OTM_API_KEY}`;

    const otmRes = await fetch(otmUrl);
    
    if (!otmRes.ok) {
      const txt = await otmRes.text().catch(() => "");
      return res.status(502).json({ message: "Eroare la OpenTripMap API.", details: txt });
    }

    const places = await otmRes.json();

    if (places.error) {
       return res.status(400).json({ message: "Eroare de la furnizorul de atractii", details: places.error });
    }

    const placesArray = Array.isArray(places) ? places : (places.features || []);

    const results = placesArray
      .filter((p) => (p.name || (p.properties && p.properties.name)))
      .slice(0, 10)
      .map((p) => ({
        xid: p.xid || (p.properties && p.properties.xid),
        name: p.name || (p.properties && p.properties.name),
        kinds: p.kinds || (p.properties && p.properties.kinds) || "",
        rate: p.rate || (p.properties && p.properties.rate) || 0,
        lat: p.point?.lat || (p.geometry && p.geometry.coordinates[1]) || null,
        lon: p.point?.lon || (p.geometry && p.geometry.coordinates[0]) || null,
      }));

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: "Eroare interna server.", details: error.message });
  }
}

async function addItem(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
   const rawName = req.body.name || req.body.address || "Locatie noua";
    const name = String(rawName).trim();
    const lat = req.body.lat;
    const lon = req.body.lon ?? req.body.lng; 
    const kinds = req.body.kinds || req.body.category || null;
    const xid = req.body.xid || null;
    const dayNum = Number(req.body.day_number) || (Number(req.body.dayIndex) + 1) || 1;

    if (lat == null || lon == null) {
      return res.status(400).json({ message: "Coordonatele lat si lon sunt obligatorii." });
    }

    const tripResult = await pool.query(
      `SELECT id FROM "Itineraries" WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Itinerariul nu a fost gasit." });
    }

    let destId;
    const safeKinds = kinds ? String(kinds).substring(0, 200) : null;
    const parsedLat = parseFloat(lat) || 0;
    const parsedLon = parseFloat(lon) || 0;

    if (xid) {
      const existing = await pool.query(
        `SELECT id FROM "Destinations" WHERE source = 'opentripmap' AND source_id = $1`,
        [xid]
      );

      if (existing.rows.length > 0) {
        destId = existing.rows[0].id;
      } else {
        const inserted = await pool.query(
          `
          INSERT INTO "Destinations" (name, country, latitude, longitude, source, source_id, kinds)
          VALUES ($1, '', $2, $3, 'opentripmap', $4, $5)
          RETURNING id
          `,
          [name, parsedLat, parsedLon, xid, safeKinds]
        );
        destId = inserted.rows[0].id;
      }
    } else {
      const existing = await pool.query(
        `
        SELECT id FROM "Destinations"
        WHERE LOWER(name) = LOWER($1)
          AND ABS(latitude  - $2) < 0.01
          AND ABS(longitude - $3) < 0.01
        LIMIT 1
        `,
        [name, parsedLat, parsedLon]
      );

      if (existing.rows.length > 0) {
        destId = existing.rows[0].id;
      } else {
        const inserted = await pool.query(
          `
          INSERT INTO "Destinations" (name, country, latitude, longitude, kinds)
          VALUES ($1, '', $2, $3, $4)
          RETURNING id
          `,
          [name, parsedLat, parsedLon, safeKinds]
        );
        destId = inserted.rows[0].id;
      }
    }

    // Stabileste ordinea in ziua respectiva
    const orderResult = await pool.query(
      `
      SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order
      FROM "Itinerary_Items"
      WHERE itinerary_id = $1 AND day_number = $2
      `,
      [id, dayNum]
    );
    const nextOrder = orderResult.rows[0].next_order;

    const itemResult = await pool.query(
      `
      INSERT INTO "Itinerary_Items" (itinerary_id, destination_id, day_number, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING id, itinerary_id, destination_id, day_number, order_index
      `,
      [id, destId, dayNum, nextOrder]
    );

    return res.status(201).json({
      ...itemResult.rows[0],
      name: name,
      lat: parsedLat,
      lon: parsedLon,
      kinds: safeKinds,
    });
  } catch (error) {
    console.error("addItem error backend:", error);
    return res.status(500).json({ message: "Eroare interna server.", details: error.message });
  }
}

async function searchPOI(req, res) {
  try {
    const { id } = req.params;
    const { q } = req.query;
    
    if (!q || q.length < 2) return res.json([]);

   const tripResult = await pool.query(
      `SELECT destination FROM "Itineraries" WHERE id = $1`, 
      [id]
    );
    if (tripResult.rows.length === 0) return res.json([]);
    
    const cityName = tripResult.rows[0].destination.split(",")[0].trim();

    const destResult = await pool.query(
      `SELECT latitude, longitude FROM "Destinations" WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [cityName]
    );
    if (destResult.rows.length === 0) return res.json([]);
    const { latitude, longitude } = destResult.rows[0];

    const radius = 50000; 
    const otmUrl = 
      `${OTM_BASE}/places/autosuggest` +
      `?name=${encodeURIComponent(q)}` +
      `&radius=${radius}` +
      `&lon=${longitude}` +
      `&lat=${latitude}` +
      `&format=json` +
      `&limit=15` +
      `&apikey=${OTM_API_KEY}`;
    
    const otmRes = await fetch(otmUrl);
    if (!otmRes.ok) return res.json([]);
    
    const places = await otmRes.json();
    if (places.error) return res.json([]);
    
    const placesArray = Array.isArray(places) ? places : (places.features || []);
    
    const results = placesArray.map(p => ({
      id: p.xid || (p.properties && p.properties.xid),
      name: p.name || (p.properties && p.properties.name),
      lat: p.point?.lat || (p.geometry && p.geometry.coordinates[1]) || null,
      lng: p.point?.lon || (p.geometry && p.geometry.coordinates[0]) || null,
      country_en: (p.kinds || (p.properties && p.properties.kinds) || "Atractie").split(",")[0].replace(/_/g, " "),
      xid: p.xid || (p.properties && p.properties.xid)
    })).filter(p => p.name);

    return res.json(results);
  } catch (error) {
    console.error("searchPOI error:", error);
    return res.status(500).json({ message: "Eroare interna la cautare.", details: error.message });
  }
}

module.exports = {
  createTrip,
  getTripById,
  getRecommendations,
  addItem,
  searchPOI
};