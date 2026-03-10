const express = require("express");
const { getDashboard } = require("../controllers/dashboard.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getDashboard);

module.exports = router;