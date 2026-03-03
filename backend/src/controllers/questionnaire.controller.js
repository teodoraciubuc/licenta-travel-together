const pool = require("../db");

async function getTags(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name FROM "Tags" ORDER BY name'
    );

    res.json(result.rows);
  } catch (err) {
    console.error("getTags error:", err);
    res.status(500).json({ message: "Database error" });
  }
}
async function savePreferences(req, res) {
  console.log("[SAVE PREF] userId:", req.user?.id);
  console.log("SAVE PREF HIT:", {
    user: req.user,
    body: req.body
  });
  const userId = req.user.id; 
  const { preferences } = req.body;

  if (!Array.isArray(preferences)) {
    return res.status(400).json({ message: "preferences must be array" });
  }

  try {
    await pool.query(
      'DELETE FROM "User_Preferences" WHERE user_id = $1',
      [userId]
    );
    for (const p of preferences) {
      const tagId = Number(p.tagId);
      const score = Number(p.score);

      if (!tagId || Number.isNaN(score)) continue;

      await pool.query(
        'INSERT INTO "User_Preferences" (user_id, tag_id, score) VALUES ($1, $2, $3)',
        [userId, tagId, score]
      );
    }

    res.json({ message: "Preferences saved successfully"});
  } catch (err) {
    console.error("savePreferences error:", err);
    res.status(500).json({ message: "Error saving preferences" });
  }
}

module.exports = { getTags, savePreferences };