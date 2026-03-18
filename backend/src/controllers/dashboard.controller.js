const pool = require("../db");

async function getDashboard(req, res) {
  try {
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const offset = parseInt(req.query.offset || 0, 10);
    const limit = 6;
    const MAX_SCORE = 15;

    const { rows: prefRows } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM "User_Preferences" WHERE user_id = $1',
      [userId]
    );
    const preferencesCount = parseInt(prefRows[0]?.cnt || 0, 10);

    const { rows: mapRows } = await pool.query(
      'SELECT status, COUNT(*) AS cnt FROM "User_Map_Status" WHERE user_id = $1 GROUP BY status',
      [userId]
    );

    const mapCounts = { visited: 0, wishlist: 0, planned: 0 };
    for (const r of mapRows) {
      if (mapCounts[r.status] !== undefined) {
        mapCounts[r.status] = parseInt(r.cnt, 10);
      }
    }

    const { rows: itCountRows } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM "Itineraries" WHERE user_id = $1',
      [userId]
    );
    const itinerariesCount = parseInt(itCountRows[0]?.cnt || 0, 10);

    const { rows: recentIts } = await pool.query(
      'SELECT id, title, start_date, end_date FROM "Itineraries" WHERE user_id = $1 ORDER BY id DESC LIMIT 3',
      [userId]
    );

    const { rows: visitedRows } = await pool.query(
      `SELECT d.id, d.name, d.latitude, d.longitude, d.country_en
       FROM "User_Map_Status" ums
       JOIN "Destinations" d ON d.id = ums.destination_id
       WHERE ums.user_id = $1 AND ums.status = 'visited'
         AND d.latitude IS NOT NULL AND d.longitude IS NOT NULL`,
      [userId]
    );

    const recsRes = await pool.query(
      `SELECT
         d.id,
         d.name,
         d.country,
         d.country_en,
         d.latitude,
         d.longitude,
         d.image_url,
         COALESCE(SUM(up.score), 0) AS raw_score
       FROM "Destinations" d
       LEFT JOIN "Destination_Tags" dt ON dt.destination_id = d.id
       LEFT JOIN "User_Preferences" up
         ON up.tag_id = dt.tag_id AND up.user_id = $1
       GROUP BY
         d.id, d.name, d.country, d.country_en, d.latitude, d.longitude, d.image_url
       HAVING COALESCE(SUM(up.score), 0) > 0
       ORDER BY raw_score DESC, d.id ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const recommendations = recsRes.rows.map(dest => {
      const rawScore = parseFloat(dest.raw_score);
      const finalScore = Math.min(Math.round((rawScore / MAX_SCORE) * 100), 100);
      return {
        id: dest.id,
        name: dest.name,
        country: dest.country,
        country_en: dest.country_en,
        latitude: dest.latitude,
        longitude: dest.longitude,
        image_url: dest.image_url,
        final_score: finalScore,
      };
    });

    return res.json({
      profile: {
        preferencesCount,
        hasPreferences: preferencesCount > 0,
      },
      mapCounts,
      itinerariesCount,
      recentItineraries: recentIts,
      recommendations,
      visitedDestinations: visitedRows,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ message: "Error fetching dashboard data" });
  }
}

module.exports = { getDashboard };
