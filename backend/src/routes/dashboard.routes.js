const express = require("express");
const { getDashboard, getFlightExplore } = require("../controllers/dashboard.controller");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/", auth, getDashboard);
router.get("/flight-explore", auth, getFlightExplore);
module.exports = router;
