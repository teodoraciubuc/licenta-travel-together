const router = require("express").Router();
const { register, login, updateUsername } = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.put("/username", auth, updateUsername);

module.exports = router;