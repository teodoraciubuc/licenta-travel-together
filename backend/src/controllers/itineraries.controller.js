const pool = require("../db");
async function createItinerary(req, res) {
  const userId = req.user.id;
  const { title, start_date, end_date } = req.body;

  if (!title) return res.status(400).json({ message: "title required" });

  const [result] = await pool.query(
    "INSERT INTO Itineraries (user_id, title, start_date, end_date) VALUES (:userId, :title, :start_date, :end_date)",
    { userId, title, start_date: start_date || null, end_date: end_date || null }
  );

  res.status(201).json({ id: result.insertId });
}

async function addItem(req, res) {
  const userId = req.user.id;
  const { itineraryId, destinationId, day_number, order_index } = req.body;

  if (!itineraryId || !destinationId) return res.status(400).json({ message: "itineraryId and destinationId required" });

  const [it] = await pool.query(
    "SELECT id FROM Itineraries WHERE id = :itineraryId AND user_id = :userId",
    { itineraryId, userId }
  );
  if (!it.length) return res.status(403).json({ message: "Not your itinerary" });

  const [result] = await pool.query(
    "INSERT INTO Itinerary_Items (itinerary_id, destination_id, day_number, order_index) VALUES (:itineraryId, :destinationId, :day_number, :order_index)",
    { itineraryId, destinationId, day_number: day_number || 1, order_index: order_index || 1 }
  );

  res.status(201).json({ id: result.insertId });
}

async function getMyItineraries(req, res) {
  const userId = req.user.id;

  const [its] = await pool.query(
    "SELECT id, title, start_date, end_date FROM Itineraries WHERE user_id = :userId ORDER BY id DESC",
    { userId }
  );

  const ids = its.map((x) => x.id);
  if (!ids.length) return res.json([]);

  const [items] = await pool.query(
    `
    SELECT ii.itinerary_id, ii.id, ii.day_number, ii.order_index,
           d.id as destination_id, d.name, d.country, d.latitude, d.longitude
    FROM Itinerary_Items ii
    JOIN Destinations d ON d.id = ii.destination_id
    WHERE ii.itinerary_id IN (${ids.map(() => "?").join(",")})
    ORDER BY ii.itinerary_id, ii.day_number, ii.order_index
    `,
    ids
  );

  const map = new Map();
  for (const it of its) map.set(it.id, { ...it, items: [] });
  for (const item of items) map.get(item.itinerary_id)?.items.push(item);

  res.json(Array.from(map.values()));
}

module.exports = { createItinerary, addItem, getMyItineraries };
