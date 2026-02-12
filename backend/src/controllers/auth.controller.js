const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  const { username, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password required" });

  const [existing] = await pool.query("SELECT id FROM Users WHERE email = :email", { email });
  if (existing.length) return res.status(409).json({ message: "Email already used" });

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    "INSERT INTO Users (username, email, password_hash, created_at) VALUES (:username, :email, :password_hash, NOW())",
    { username: username || null, email, password_hash }
  );

  res.status(201).json({ id: result.insertId, email });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password required" });

  const [rows] = await pool.query("SELECT id, password_hash FROM Users WHERE email = :email", { email });
  if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.json({ token });
}

module.exports = { register, login };
