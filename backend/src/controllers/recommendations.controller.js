const pool = require("../db");

async function getRecommendations(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit || 10), 50);

    const sql = `
      SELECT
        d.id,
        d.name,
        COALESCE(d.country_en, d.country) AS country_name,
        d.latitude,
        d.longitude,
        d.image_url,
        COALESCE(SUM(up.score), 0) AS score,
        COALESCE(string_agg(DISTINCT t.name, ', ' ORDER BY t.name), '') AS tags
      FROM "Destinations" d
      LEFT JOIN "Destination_Tags" dt ON dt.destination_id = d.id
      LEFT JOIN "Tags" t ON t.id = dt.tag_id
      LEFT JOIN "User_Preferences" up
        ON up.tag_id = dt.tag_id AND up.user_id = $1
      WHERE d.id NOT IN (
        SELECT destination_id
        FROM "User_Map_Status"
        WHERE user_id = $1 AND status = 'visited'
      )
      GROUP BY d.id, d.name, d.country_en, d.country, d.latitude, d.longitude, d.image_url
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