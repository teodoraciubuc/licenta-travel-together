const pool = require("../db");

async function getRecommendations(req, res) {
  const userId = req.user.id;
  const limit = Math.min(Number(req.query.limit || 10), 50);

  const sql = `
    SELECT
      d.id, d.name, d.country, d.description, d.latitude, d.longitude,
      COALESCE(SUM(up.score), 0) AS score
    FROM Destinations d
    LEFT JOIN Destination_Tags dt ON dt.destination_id = d.id
    LEFT JOIN User_Preferences up ON up.tag_id = dt.tag_id AND up.user_id = :userId
    GROUP BY d.id
    ORDER BY score DESC, d.name ASC
    LIMIT :limit
  `;

  const [rows] = await pool.query(sql, { userId, limit });
  res.json(rows);
}

module.exports = { getRecommendations };
