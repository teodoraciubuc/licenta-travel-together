const router = require("express").Router();
const auth = require("../middleware/auth");
const { getRecommendations } = require("../controllers/recommendations.controller");

router.get("/", auth, getRecommendations);

module.exports = router;
