var express = require("express");
var router = express.Router();
var authControllers = require("../controllers/authControllers");

router.post("/signup/", authControllers.localSignup);
router.post("/login/", authControllers.localLogin);
router.get("/activate-account", authControllers.activateAccount)

module.exports = router;
