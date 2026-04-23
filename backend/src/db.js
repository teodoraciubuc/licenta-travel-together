const { Pool } = require("pg");
require("dotenv").config();

const internalPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = {
  pool: internalPool,
  query: (text, params) => internalPool.query(text, params),
};