const pool = require("../db");

async function createTrip(req, res) {
  try {
    const userId = req.user?.userId || req.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Eroare de autentificare." });
    }

    const { name, destination, startDate, endDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name este obligatoriu." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate si endDate sunt obligatorii." });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "endDate trebuie sa fie dupa startDate." });
    }

    const result = await pool.query(
      `
      INSERT INTO "Itineraries" (user_id, title, destination, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        user_id,
        title AS name,
        destination,
        start_date AS "startDate",
        end_date AS "endDate",
        created_at
      `,
      [userId, name.trim(), destination?.trim() || "", startDate, endDate]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("createTrip error:", error);
    return res.status(500).json({ message: "Eroare interna server.", details: error.message });
  }
}

async function getTripById(req, res) {
  try {
    const userId = req.user?.userId || req.userId || req.user?.id;
    const { id } = req.params;

    const tripResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        title AS name,
        destination,
        start_date AS "startDate",
        end_date AS "endDate",
        created_at
      FROM "Itineraries"
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Itinerariul nu a fost gasit." });
    }

    const trip = tripResult.rows[0];

    return res.json({
      ...trip,
      stops: []
    });
  } catch (error) {
    console.error("getTripById error:", error);
    return res.status(500).json({ message: "Eroare interna server.", details: error.message });
  }
}

module.exports = {
  createTrip,
  getTripById
};