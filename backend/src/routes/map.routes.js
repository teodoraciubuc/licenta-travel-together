const router = require("express").Router();
const auth = require("../middleware/auth");
const { getMyMap, setMapStatus } = require("../controllers/map.controller");

router.get("/me", auth, getMyMap);
router.post("/status", auth, setMapStatus);

module.exports = router;
