const express = require("express");
const cors = require("cors");

const pool = require("./db"); // <-- adauga asta

const authRoutes = require("./routes/auth.routes");
const questionnaireRoutes = require("./routes/questionnaire.routes");
const recommendationsRoutes = require("./routes/recommendations.routes");
const mapRoutes = require("./routes/map.routes");
const itinerariesRoutes = require("./routes/itineraries.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/db-test", async (req, res) => {   // <-- adauga endpointul
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    return res.json(rows[0]); // { ok: 1 }
  } catch (e) {
    return res.status(500).json({
      code: e.code,
      message: e.sqlMessage || e.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/questionnaire", questionnaireRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/itineraries", itinerariesRoutes);

module.exports = app;
