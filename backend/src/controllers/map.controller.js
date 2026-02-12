const pool = require("../db");

async function getMyMap(req, res) {
  const userId = req.user.id;

  const sql = `
    SELECT d.id, d.name, d.country, d.latitude, d.longitude, ums.status
    FROM User_Map_Status ums
    JOIN Destinations d ON d.id = ums.destination_id
    WHERE ums.user_id = :userId
    ORDER BY d.name
  `;
  const [rows] = await pool.query(sql, { userId });
  res.json(rows);
}

async function setMapStatus(req, res) {
  const userId = req.user.id;
  const { destinationId, status } = req.body;

  if (!destinationId || !status) return res.status(400).json({ message: "destinationId and status required" });

  const allowed = new Set(["visited", "wishlist", "planned"]);
  if (!allowed.has(status)) return res.status(400).json({ message: "invalid status" });

  const [existing] = await pool.query(
    "SELECT id FROM User_Map_Status WHERE user_id = :userId AND destination_id = :destinationId",
    { userId, destinationId }
  );

  if (existing.length) {
    await pool.query("UPDATE User_Map_Status SET status = :status WHERE id = :id", {
      status,
      id: existing[0].id,
    });
  } else {
    await pool.query(
      "INSERT INTO User_Map_Status (user_id, destination_id, status) VALUES (:userId, :destinationId, :status)",
      { userId, destinationId, status }
    );
  }

  res.json({ ok: true });
}

module.exports = { getMyMap, setMapStatus };
