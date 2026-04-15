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
       WHERE d.id NOT IN (
         SELECT destination_id
         FROM "User_Map_Status"
         WHERE user_id = $1 AND status = 'visited'
       )
       GROUP BY
         d.id, d.name, d.country, d.country_en, d.latitude, d.longitude, d.image_url
       HAVING COALESCE(SUM(up.score), 0) > 0
       ORDER BY raw_score DESC, d.id ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const recommendations = recsRes.rows.map((dest) => {
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

const AIRPORT_COORDS = {
  AMS: { lat: 52.3086, lon: 4.7639, city: "Amsterdam" },
  ATH: { lat: 37.9364, lon: 23.9445, city: "Atena" },
  BCN: { lat: 41.2974, lon: 2.0833, city: "Barcelona" },
  BER: { lat: 52.3667, lon: 13.5033, city: "Berlin" },
  BRU: { lat: 50.901, lon: 4.4844, city: "Bruxelles" },
  BTS: { lat: 48.1702, lon: 17.2127, city: "Bratislava" },
  BUD: { lat: 47.4369, lon: 19.2556, city: "Budapest" },
  CDG: { lat: 49.0097, lon: 2.5479, city: "Paris" },
  CPH: { lat: 55.618, lon: 12.656, city: "Copenhaga" },
  DUB: { lat: 53.4213, lon: -6.27, city: "Dublin" },
  FCO: { lat: 41.8003, lon: 12.2389, city: "Roma" },
  FRA: { lat: 50.0379, lon: 8.5622, city: "Frankfurt" },
  HEL: { lat: 60.3172, lon: 24.9633, city: "Helsinki" },
  IST: { lat: 41.2608, lon: 28.7418, city: "Istanbul" },
  LGW: { lat: 51.1537, lon: -0.1821, city: "Londra" },
  LHR: { lat: 51.4775, lon: -0.4614, city: "Londra" },
  LIS: { lat: 38.7756, lon: -9.1354, city: "Lisabona" },
  MAD: { lat: 40.4719, lon: -3.5626, city: "Madrid" },
  MAN: { lat: 53.3537, lon: -2.275, city: "Manchester" },
  MLA: { lat: 35.8575, lon: 14.4775, city: "Malta" },
  MUC: { lat: 48.3537, lon: 11.775, city: "Munchen" },
  MXP: { lat: 45.6306, lon: 8.7281, city: "Milano" },
  NAP: { lat: 40.886, lon: 14.2908, city: "Napoli" },
  NCE: { lat: 43.6584, lon: 7.2159, city: "Nisa" },
  OPO: { lat: 41.2481, lon: -8.6814, city: "Porto" },
  OSL: { lat: 60.1939, lon: 11.1004, city: "Oslo" },
  OTP: { lat: 44.5711, lon: 26.085, city: "Bucuresti" },
  PMI: { lat: 39.5517, lon: 2.7388, city: "Palma de Mallorca" },
  PRG: { lat: 50.1008, lon: 14.26, city: "Praga" },
  RIX: { lat: 56.9236, lon: 23.9711, city: "Riga" },
  SKG: { lat: 40.5197, lon: 22.9709, city: "Salonic" },
  SOF: { lat: 42.6967, lon: 23.4114, city: "Sofia" },
  SPU: { lat: 43.5389, lon: 16.2978, city: "Split" },
  STN: { lat: 51.885, lon: 0.235, city: "Londra" },
  TLL: { lat: 59.4133, lon: 24.8328, city: "Tallinn" },
  VCE: { lat: 45.5053, lon: 12.3519, city: "Venetia" },
  VIE: { lat: 48.1103, lon: 16.5697, city: "Viena" },
  VLC: { lat: 39.4893, lon: -0.4816, city: "Valencia" },
  WAW: { lat: 52.1672, lon: 20.9679, city: "Varsovia" },
  ZRH: { lat: 47.4647, lon: 8.5492, city: "Zurich" },
};

async function getFlightExplore(req, res) {
  try {
    const { origin = "OTP" } = req.query;

    const popularFromRo = [
      { destination: "BCN", price: 89 },
      { destination: "MAD", price: 95 },
      { destination: "FCO", price: 67 },
      { destination: "VIE", price: 45 },
      { destination: "PRG", price: 52 },
      { destination: "BUD", price: 38 },
      { destination: "BTS", price: 42 },
      { destination: "WAW", price: 55 },
      { destination: "AMS", price: 110 },
      { destination: "CDG", price: 98 },
      { destination: "LGW", price: 87 },
      { destination: "MUC", price: 72 },
      { destination: "FRA", price: 78 },
      { destination: "ZRH", price: 125 },
      { destination: "LIS", price: 115 },
      { destination: "ATH", price: 62 },
      { destination: "SKG", price: 58 },
      { destination: "IST", price: 70 },
      { destination: "DUB", price: 130 },
      { destination: "CPH", price: 118 },
      { destination: "OSL", price: 135 },
      { destination: "HEL", price: 128 },
      { destination: "MLA", price: 75 },
      { destination: "SPU", price: 55 },
      { destination: "NCE", price: 88 },
      { destination: "NAP", price: 72 },
      { destination: "PMI", price: 95 },
      { destination: "OPO", price: 108 },
      { destination: "VLC", price: 92 },
      { destination: "TLL", price: 142 },
      { destination: "RIX", price: 138 },
      { destination: "SOF", price: 35 },
    ];

    const results = popularFromRo
      .map((item) => {
        const coords = AIRPORT_COORDS[item.destination];
        if (!coords) return null;

        const variation = Math.floor(Math.random() * 20) - 10;
        const price = Math.max(29, item.price + variation);

        return {
          destination: item.destination,
          city: coords.city,
          lat: coords.lat,
          lon: coords.lon,
          price,
          currency: "EUR",
          departureDate: null,
          returnDate: null,
          origin,
          bookingUrl: `https://www.momondo.ro/flights/${origin}-${item.destination}?lang=ro`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.price - b.price);

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: "Eroare.", details: error.message });
  }
}

module.exports = { getDashboard, getFlightExplore };
