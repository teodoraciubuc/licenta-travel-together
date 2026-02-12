const router = require("express").Router();
const auth = require("../middleware/auth");
const { createItinerary, addItem, getMyItineraries } = require("../controllers/itineraries.controller");

router.post("/", auth, createItinerary);
router.post("/items", auth, addItem);
router.get("/me", auth, getMyItineraries);

module.exports = router;
