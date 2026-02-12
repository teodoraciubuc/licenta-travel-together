const router = require("express").Router();
const auth = require("../middleware/auth");
const { getTags, savePreferences } = require("../controllers/questionnaire.controller");

router.get("/tags", getTags);
router.post("/preferences", auth, savePreferences);

module.exports = router;
