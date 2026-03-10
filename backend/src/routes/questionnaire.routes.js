const router = require("express").Router();
const auth = require("../middleware/auth");
const { getTags, savePreferences, getPreferences } = require("../controllers/questionnaire.controller");

router.get("/tags", getTags);
router.get("/preferences", auth, getPreferences);
router.post("/preferences", auth, savePreferences);

module.exports = router;