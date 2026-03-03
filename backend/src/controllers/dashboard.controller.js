const pool = require("../db");

/**
 * Dashboard endpoint:
 * - summary counts (itineraries, map statuses)
 * - profile completion (are preferences saved?)
 * - recent itineraries (last 3)
 * - top recommendations (limit 6)
 */
async function getDashboard(req, res) {
  try {
    const userId = req.user.id;

    // 1) Profile completion: has preferences?
    const [prefRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM User_Preferences WHERE user_id = :userId",
      { userId }
    );
    const preferencesCount = prefRows?.[0]?.cnt || 0;

    // 2) Map status counts (visited / wishlist / planned)
    const [mapRows] = await pool.query(
      `
      SELECT status, COUNT(*) AS cnt
      FROM User_Map_Status
      WHERE user_id = :userId
      GROUP BY status
      `,
      { userId }
    );

    const mapCounts = { visited: 0, wishlist: 0, planned: 0 };
    for (const r of mapRows) {
      if (mapCounts[r.status] !== undefined) mapCounts[r.status] = Number(r.cnt);
    }

    // 3) Itineraries count
    const [itCountRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM Itineraries WHERE user_id = :userId",
      { userId }
    );
    const itinerariesCount = itCountRows?.[0]?.cnt || 0;

    // 4) Recent itineraries (last 3)
    const [recentIts] = await pool.query(
      `
      SELECT id, title, start_date, end_date
      FROM Itineraries
      WHERE user_id = :userId
      ORDER BY id DESC
      LIMIT 3
      `,
      { userId }
    );

    // 5) Top recommendations (limit 6) - same scoring logic as recommendations.controller.js
    const limit = 6;
    const [recs] = await pool.query(
      `
      SELECT
        d.id, d.name, d.country, d.description, d.latitude, d.longitude,
        COALESCE(SUM(up.score), 0) AS score
      FROM Destinations d
      LEFT JOIN Destination_Tags dt ON dt.destination_id = d.id
      LEFT JOIN User_Preferences up ON up.tag_id = dt.tag_id AND up.user_id = :userId
      GROUP BY d.id
      ORDER BY score DESC, d.name ASC
      LIMIT :limit
      `,
      { userId, limit }
    );

    res.json({
      profile: {
        preferencesCount,
        hasPreferences: preferencesCount > 0,
      },
      counts: {
        itineraries: Number(itinerariesCount),
        map: mapCounts,
      },
      recentItineraries: recentIts,
      topRecommendations: recs,
    });
  } catch (e) {
    return res.status(500).json({
      code: e.code,
      message: e.sqlMessage || e.message,
    });
  }
}

module.exports = { getDashboard };