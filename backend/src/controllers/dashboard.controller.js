const pool = require("../db");

async function getDashboard(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const prefRes = await pool.query(
      'SELECT COUNT(*) AS cnt FROM "User_Preferences" WHERE user_id = $1',
      [userId]
    );
    const preferencesCount = parseInt(prefRes.rows[0]?.cnt || 0, 10);

    const mapRes = await pool.query(
      'SELECT status, COUNT(*) AS cnt FROM "User_Map_Status" WHERE user_id = $1 GROUP BY status',
      [userId]
    );
    const mapCounts = { visited: 0, wishlist: 0, planned: 0 };

    for (const r of mapRes.rows) {
      if (mapCounts[r.status] !== undefined) {
        mapCounts[r.status] = parseInt(r.cnt, 10);
      }
    }

    const itCountRes = await pool.query(
      'SELECT COUNT(*) AS cnt FROM "Itineraries" WHERE user_id = $1',
      [userId]
    );
    const itinerariesCount = parseInt(itCountRes.rows[0]?.cnt || 0, 10);

    const recentRes = await pool.query(
      'SELECT id, title, start_date, end_date FROM "Itineraries" WHERE user_id = $1 ORDER BY id DESC LIMIT 3',
      [userId]
    );
    const recentIts = recentRes.rows;

    const recsRes = await pool.query(
  `SELECT
    d.id,
    d.name,
    COALESCE(d.country_en, d.country) AS country,
    d.description_en AS description,
    d.latitude,
    d.longitude,
    d.otm_rate,
    COALESCE(SUM(up.score), 0) AS score,
    (
      COALESCE(SUM(up.score), 0) * 10
      + COALESCE(d.otm_rate, 0)
      + CASE
          WHEN d.description IS NOT NULL
           AND d.description <> ''
           AND d.description NOT LIKE '%,%'
           AND d.description NOT LIKE '%\\_%' ESCAPE '\\'
          THEN 3
          ELSE 0
        END
      + CASE
          WHEN d.name IN (
            'Paris','Rome','Barcelona','Vienna','Prague','Budapest','Amsterdam',
            'Berlin','Lisbon','Athens','Madrid','Florence','Venice','Krakow',
            'Edinburgh','Seville','Nice','Dubrovnik','Santorini',
            'Palma de Mallorca','Zermatt','Chamonix','Interlaken','Innsbruck',
            'Reykjavik','Brasov','Copenhagen','Stockholm','Dublin','Zurich'
          )
          THEN 20
          ELSE 0
        END
      + CASE
          WHEN LOWER(d.name) NOT LIKE '%beach%'
           AND LOWER(d.name) NOT LIKE '%plage%'
           AND LOWER(d.name) NOT LIKE '%bucht%'
          THEN 2
          ELSE 0
        END
    ) AS final_score
  FROM "Destinations" d
  LEFT JOIN "Destination_Tags" dt ON dt.destination_id = d.id
  LEFT JOIN "User_Preferences" up
    ON up.tag_id = dt.tag_id
   AND up.user_id = $1
  WHERE d.name IS NOT NULL
    AND d.name <> ''
  GROUP BY d.id
  HAVING COALESCE(SUM(up.score), 0) > 0
  ORDER BY final_score DESC, d.name ASC
  LIMIT $2`,
  [userId, 6]
);

    const recs = recsRes.rows;

    return res.json({
      profile: {
        preferencesCount,
        hasPreferences: preferencesCount > 0,
      },
      mapCounts,
      itinerariesCount,
      recentItineraries: recentIts,
      recommendations: recs,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ message: "Error fetching dashboard data" });
  }
}

module.exports = { getDashboard };