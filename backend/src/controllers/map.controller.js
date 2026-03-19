const pool = require('../db');

const STATUS_PRIORITY = {
  wishlist: 1,
  planned: 2,
  visited: 3,
};

async function getMyMap(req, res) {
  try {
    const userId = req.user?.id || req.user?.userId;

    const result = await pool.query(
      `
      SELECT
        d.id,
        d.name,
        d.country        AS country_code,
        d.country_en,
        d.latitude,
        d.longitude,
        ums.status,
        ums.rating
      FROM "User_Map_Status" ums
      JOIN "Destinations" d ON d.id = ums.destination_id
      WHERE ums.user_id = $1
      ORDER BY d.name ASC
      `,
      [userId]
    );

    const destinations = result.rows;
    const countriesMap = {};

    for (const d of destinations) {
      const codeKey = (d.country_code || '').trim().toUpperCase();
      const nameKey = (d.country_en || d.country || '').trim().toLowerCase();
      if (!codeKey && !nameKey) continue;
      const mainKey = codeKey || nameKey;

      if (!countriesMap[mainKey]) {
        countriesMap[mainKey] = {
          country_name: d.country_en || d.country,
          country_code: d.country_code || null,
          status: d.status,
          destinations: [],
        };
      }

      countriesMap[mainKey].destinations.push({ id: d.id, name: d.name, status: d.status });

      if (STATUS_PRIORITY[d.status] > STATUS_PRIORITY[countriesMap[mainKey].status]) {
        countriesMap[mainKey].status = d.status;
      }
    }

    return res.json({ destinations, countries: Object.values(countriesMap) });
  } catch (err) {
    console.error('getMyMap error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
}

async function setMapStatus(req, res) {
  const userId = req.user?.id || req.user?.userId;
  const { destinationId, status } = req.body;

  if (!destinationId || !status)
    return res.status(400).json({ message: 'destinationId and status required' });

  const allowed = new Set(['visited', 'wishlist', 'planned']);
  if (!allowed.has(status))
    return res.status(400).json({ message: 'invalid status' });

  try {
    const existing = await pool.query(
      'SELECT id FROM "User_Map_Status" WHERE user_id = $1 AND destination_id = $2',
      [userId, destinationId]
    );

    if (existing.rows.length > 0) {
      await pool.query('UPDATE "User_Map_Status" SET status = $1 WHERE id = $2', [status, existing.rows[0].id]);
    } else {
      await pool.query(
        'INSERT INTO "User_Map_Status" (user_id, destination_id, status) VALUES ($1, $2, $3)',
        [userId, destinationId, status]
      );
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('setMapStatus error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
}

async function removeMapStatus(req, res) {
  const userId = req.user?.id || req.user?.userId;
  const { destinationId } = req.body;

  if (!destinationId)
    return res.status(400).json({ message: 'destinationId required' });

  try {
    await pool.query(
      'DELETE FROM "User_Map_Status" WHERE user_id = $1 AND destination_id = $2',
      [userId, destinationId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('removeMapStatus error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
}

async function searchDestinations(req, res) {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  try {
    const result = await pool.query(
      `
      SELECT id, name, country AS country_code, country_en, latitude, longitude
      FROM "Destinations"
      WHERE name ILIKE $1 OR country ILIKE $1 OR country_en ILIKE $1
      ORDER BY
        CASE
          WHEN name ILIKE $2 THEN 1
          WHEN country_en ILIKE $2 THEN 2
          WHEN country ILIKE $2 THEN 3
          ELSE 4
        END,
        country_en ASC, name ASC
      LIMIT 30
      `,
      [`%${q}%`, `${q}%`]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('searchDestinations error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
}

async function setCountryStatus(req, res) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { countryName, status } = req.body;

    if (!countryName || !status)
      return res.status(400).json({ message: 'countryName and status required' });

    const allowed = new Set(['visited', 'planned', 'wishlist']);
    if (!allowed.has(status))
      return res.status(400).json({ message: 'invalid status' });

    const destinationsResult = await pool.query(
      'SELECT id FROM "Destinations" WHERE country ILIKE $1 OR country_en ILIKE $1',
      [countryName]
    );

    if (destinationsResult.rows.length === 0)
      return res.status(404).json({ message: 'No destinations found for this country' });

    for (const dest of destinationsResult.rows) {
      const existing = await pool.query(
        'SELECT id FROM "User_Map_Status" WHERE user_id = $1 AND destination_id = $2',
        [userId, dest.id]
      );
      if (existing.rows.length > 0) {
        await pool.query('UPDATE "User_Map_Status" SET status = $1 WHERE id = $2', [status, existing.rows[0].id]);
      } else {
        await pool.query(
          'INSERT INTO "User_Map_Status" (user_id, destination_id, status) VALUES ($1, $2, $3)',
          [userId, dest.id, status]
        );
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('setCountryStatus error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
}

async function removeCountryStatus(req, res) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { countryName } = req.body;

    if (!countryName)
      return res.status(400).json({ message: 'countryName required' });

    await pool.query(
      `DELETE FROM "User_Map_Status"
       WHERE user_id = $1
         AND destination_id IN (
           SELECT id FROM "Destinations" WHERE country ILIKE $2 OR country_en ILIKE $2
         )`,
      [userId, countryName]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('removeCountryStatus error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
}

/**
 * POST /api/map/rate
 * body: { destinationId, rating }  — rating 1-5
 *
 * Saves the rating on User_Map_Status, then boosts the tags
 * of that destination in User_Preferences proportionally to the rating.
 *   rating 5 → score boost +2
 *   rating 4 → boost +1
 *   rating 3 → no change
 *   rating 1-2 → boost -1 (user didn't like it)
 */
async function rateDestination(req, res) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { destinationId, rating } = req.body;

    if (!destinationId || rating == null)
      return res.status(400).json({ message: 'destinationId and rating required' });

    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5)
      return res.status(400).json({ message: 'rating must be integer 1-5' });

    // 1. Save rating on the map status row (must already exist / be visited)
    const existing = await pool.query(
      'SELECT id FROM "User_Map_Status" WHERE user_id = $1 AND destination_id = $2',
      [userId, destinationId]
    );

    if (existing.rows.length === 0) {
      // Auto-create as visited if not present
      await pool.query(
        'INSERT INTO "User_Map_Status" (user_id, destination_id, status, rating) VALUES ($1, $2, $3, $4)',
        [userId, destinationId, 'visited', r]
      );
    } else {
      await pool.query(
        'UPDATE "User_Map_Status" SET rating = $1 WHERE id = $2',
        [r, existing.rows[0].id]
      );
    }

    // 2. Boost tag preferences based on rating
    const boost = r >= 5 ? 2 : r === 4 ? 1 : r === 3 ? 0 : -1;

    if (boost !== 0) {
      // Get tags for this destination
      const tagsResult = await pool.query(
        'SELECT tag_id FROM "Destination_Tags" WHERE destination_id = $1',
        [destinationId]
      );

      for (const row of tagsResult.rows) {
        const tagId = row.tag_id;

        const prefExists = await pool.query(
          'SELECT id, score FROM "User_Preferences" WHERE user_id = $1 AND tag_id = $2',
          [userId, tagId]
        );

        if (prefExists.rows.length > 0) {
          // Clamp score between 1 and 5
          const newScore = Math.min(5, Math.max(1, Number(prefExists.rows[0].score) + boost));
          await pool.query(
            'UPDATE "User_Preferences" SET score = $1 WHERE id = $2',
            [newScore, prefExists.rows[0].id]
          );
        } else {
          // Create new preference with a neutral base + boost
          const newScore = Math.min(5, Math.max(1, 3 + boost));
          await pool.query(
            'INSERT INTO "User_Preferences" (user_id, tag_id, score) VALUES ($1, $2, $3)',
            [userId, tagId, newScore]
          );
        }
      }
    }

    return res.json({ ok: true, rating: r });
  } catch (err) {
    console.error('rateDestination error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
}

module.exports = {
  getMyMap,
  setMapStatus,
  removeMapStatus,
  searchDestinations,
  setCountryStatus,
  removeCountryStatus,
  rateDestination,
};