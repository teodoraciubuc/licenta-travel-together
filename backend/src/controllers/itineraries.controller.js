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

const MAP_STATUS_PRIORITY = {
  wishlist: 1,
  planned: 2,
  visited: 3,
};

const ITINERARY_CATEGORIES = new Set([
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "culture",
  "leisure",
  "transport",
  "hotel",
  "nature",
  "other",
]);

function getUserId(req) {
  return req.user?.userId || req.userId || req.user?.id;
}

function normalizeItineraryCategory(category) {
  if (typeof category !== "string") return "other";

  const normalized = category.trim().toLowerCase();
  return ITINERARY_CATEGORIES.has(normalized) ? normalized : "other";
}

async function ensureDestinationPlannedForUser(userId, destinationId) {
  const existingResult = await pool.query(
    `SELECT id, status FROM "User_Map_Status" WHERE user_id = $1 AND destination_id = $2`,
    [userId, destinationId]
  );

  if (existingResult.rows.length === 0) {
    await pool.query(
      `INSERT INTO "User_Map_Status" (user_id, destination_id, status) VALUES ($1, $2, $3)`,
      [userId, destinationId, "planned"]
    );
    return;
  }

  const existingEntry = existingResult.rows[0];
  const existingPriority = MAP_STATUS_PRIORITY[existingEntry.status] || 0;

  if (MAP_STATUS_PRIORITY.planned > existingPriority) {
    await pool.query(
      `UPDATE "User_Map_Status" SET status = $1 WHERE id = $2`,
      ["planned", existingEntry.id]
    );
  }
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
    const stopsResult = await pool.query(
      `
      SELECT 
        i.id, 
        i.itinerary_id, 
        i.destination_id, 
        i.day_number, 
        i.order_index,
        COALESCE(i.category, 'other') AS category,
        d.name, 
        d.latitude AS lat, 
        d.longitude AS lon
      FROM "Itinerary_Items" i
      JOIN "Destinations" d ON i.destination_id = d.id
      WHERE i.itinerary_id = $1
      ORDER BY i.day_number ASC, i.order_index ASC
      `,
      [id]
    );

    return res.json({
      ...trip,
      stops: stopsResult.rows, 
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
    if (tripResult.rows.length === 0)
      return res.status(404).json({ message: "Itinerariul nu a fost gasit." });

    const rawDestination = tripResult.rows[0].destination;
    if (!rawDestination?.trim())
      return res.status(400).json({ message: "Itinerarul nu are o destinatie setata." });

    const cityName = rawDestination.split(",")[0].trim();

    if (!OTM_API_KEY)
      return res.status(500).json({ message: "OPENTRIPMAP_API_KEY lipseste din .env." });

    const geoRes = await fetch(
      `${OTM_BASE}/places/geoname?name=${encodeURIComponent(cityName)}&apikey=${OTM_API_KEY}`
    );
    if (!geoRes.ok)
      return res.status(502).json({ message: `Nu am putut geolocata "${cityName}".` });

    const geoData = await geoRes.json();
    if (!geoData.lat || !geoData.lon)
      return res.status(404).json({ message: `Nu am gasit "${cityName}".` });

    const { lat, lon } = geoData;

    const otmRes = await fetch(
      `${OTM_BASE}/places/radius` +
      `?radius=15000` +
      `&lon=${lon}` +
      `&lat=${lat}` +
      `&kinds=interesting_places` +
      `&format=json` +
      `&limit=500` +
      `&apikey=${OTM_API_KEY}`
    );
    if (!otmRes.ok)
      return res.status(502).json({ message: "Eroare la OpenTripMap API." });

    const places = await otmRes.json();
    const placesArray = Array.isArray(places) ? places : (places.features || []);

    const seen = new Set();

    const results = placesArray
      .filter((p) => {
        const name = p.name || (p.properties?.name);
        if (!name) return false;
        const key = name.toLowerCase().substring(0, 20);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const rateA = Number(a.rate ?? a.properties?.rate ?? 0);
        const rateB = Number(b.rate ?? b.properties?.rate ?? 0);
        return rateB - rateA;
      })
      .slice(0, 10)
      .map((p) => ({
        xid: p.xid || p.properties?.xid,
        name: p.name || p.properties?.name,
        kinds: p.kinds || p.properties?.kinds || "",
        rate: p.rate || p.properties?.rate || 0,
        lat: p.point?.lat || p.geometry?.coordinates[1] || null,
        lon: p.point?.lon || p.geometry?.coordinates[0] || null,
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
    const kinds = typeof req.body.kinds === "string" ? req.body.kinds : null;
    const category = normalizeItineraryCategory(req.body.category);
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
    const parsedLat = parseFloat(lat) || 0;
    const parsedLon = parseFloat(lon) || 0;
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
        INSERT INTO "Destinations" (name, country, latitude, longitude)
        VALUES ($1, '', $2, $3)
        RETURNING id
        `,
        [name, parsedLat, parsedLon]
      );
      destId = inserted.rows[0].id;
    }

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
      INSERT INTO "Itinerary_Items" (itinerary_id, destination_id, day_number, order_index, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, itinerary_id, destination_id, day_number, order_index, category
      `,
      [id, destId, dayNum, nextOrder, category]
    );
    await ensureDestinationPlannedForUser(userId, destId);

    return res.status(201).json({
      ...itemResult.rows[0],
      name: name,
      lat: parsedLat,
      lon: parsedLon,
      kinds,
      category,
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
async function removeItem(req, res) {
  try {
    const userId = getUserId(req);
    const { id, itemId } = req.params; 

    const tripResult = await pool.query(
      `SELECT id FROM "Itineraries" WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Itinerary not found." });
    }

    const deleteResult = await pool.query(
      `DELETE FROM "Itinerary_Items" WHERE id = $1 AND itinerary_id = $2 RETURNING id`,
      [itemId, id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: "Stop not found in this itinerary." });
    }

    return res.json({ message: "Stop removed successfully." });
  } catch (error) {
    console.error("removeItem error backend:", error);
    return res.status(500).json({ message: "Internal server error.", details: error.message });
  }
}
async function updateTrip(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, destination, startDate, endDate, stops, items } = req.body;

    const tripResult = await pool.query(
      `SELECT id FROM "Itineraries" WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Itinerary not found." });
    }

    if (name || destination || startDate || endDate) {
      await pool.query(
        `UPDATE "Itineraries" 
         SET title = COALESCE($1, title), 
             destination = COALESCE($2, destination), 
             start_date = COALESCE($3, start_date), 
             end_date = COALESCE($4, end_date)
         WHERE id = $5`,
        [name || null, destination || null, startDate || null, endDate || null, id]
      );
    }

    const stopsToUpdate = stops || items;
    if (Array.isArray(stopsToUpdate)) {
      for (let i = 0; i < stopsToUpdate.length; i++) {
        const stop = stopsToUpdate[i];
        const dayNum = stop.day_number || (stop.dayIndex !== undefined ? stop.dayIndex + 1 : 1);
        const orderIdx = stop.order_index !== undefined ? stop.order_index : i;
        
        await pool.query(
          `UPDATE "Itinerary_Items" 
           SET day_number = $1, order_index = $2 
           WHERE id = $3 AND itinerary_id = $4`,
          [dayNum, orderIdx, stop.id, id]
        );
      }
    }

    return res.json({ message: "Itinerary updated successfully." });
  } catch (error) {
    console.error("updateTrip error backend:", error);
    return res.status(500).json({ message: "Internal server error.", details: error.message });
  }
}
module.exports = {
  createTrip,
  getTripById,
  getRecommendations,
  addItem,
  searchPOI,
  removeItem,
  updateTrip
};
