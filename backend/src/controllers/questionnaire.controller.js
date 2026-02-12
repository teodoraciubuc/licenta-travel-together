const pool = require("../db");

async function getTags(req, res) {
  const [rows] = await pool.query("SELECT id, name FROM Tags ORDER BY name");
  res.json(rows);
}

async function savePreferences(req, res) {
  const userId = req.user.id;
  const { preferences } = req.body; // [{ tagId, score }]

  if (!Array.isArray(preferences)) return res.status(400).json({ message: "preferences must be array" });

  await pool.query("DELETE FROM User_Preferences WHERE user_id = :userId", { userId });

  for (const p of preferences) {
    const tagId = Number(p.tagId);
    const score = Number(p.score);
    if (!tagId || Number.isNaN(score)) continue;

    await pool.query(
      "INSERT INTO User_Preferences (user_id, tag_id, score) VALUES (:userId, :tagId, :score)",
      { userId, tagId, score }
    );
  }

  res.json({ ok: true });
}

module.exports = { getTags, savePreferences };
