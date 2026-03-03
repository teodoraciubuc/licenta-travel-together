const router = require("express").Router();
const auth = require("../middleware/auth");
// Aici am adaugat getDashboard in lista de functii importate
const { createItinerary, addItem, getMyItineraries, getDashboard } = require("../controllers/dashboard.controller");

router.get("/", auth, getDashboard);

module.exports = router;