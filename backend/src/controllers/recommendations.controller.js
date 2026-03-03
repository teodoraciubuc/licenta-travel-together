const pool = require("../db");

async function getRecommendations(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit || 10), 50);

    const sql = `
      SELECT
        d.id, d.name, d.country, d.description, d.latitude, d.longitude,
        COALESCE(SUM(up.score), 0) AS score
      FROM "Destinations" d
      LEFT JOIN "Destination_Tags" dt ON dt.destination_id = d.id
      LEFT JOIN "User_Preferences" up
        ON up.tag_id = dt.tag_id AND up.user_id = $1
      GROUP BY d.id
      ORDER BY score DESC, d.name ASC
      LIMIT $2
    `;

    const result = await pool.query(sql, [userId, limit]);
    return res.json(result.rows);
  } catch (err) {
    console.error("getRecommendations error:", err);
    return res.status(500).json({ message: "Database error" });
  }
}

module.exports = { getRecommendations };