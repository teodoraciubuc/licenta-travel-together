const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const existing = await pool.query('SELECT id FROM "Users" WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ message: "Email already used" });

    const password_hash = await bcrypt.hash(password, 10);

    const inserted = await pool.query(
      'INSERT INTO "Users" (username, email, password_hash, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
      [username || null, email, password_hash]
    );

    return res.status(201).json({ id: inserted.rows[0].id, email });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });
    const q = await pool.query(
      'SELECT id, password_hash, username FROM "Users" WHERE email = $1',
      [email]
    );
    if (!q.rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, q.rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: q.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return res.json({ token, username: q.rows[0].username });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

module.exports = { register, login };