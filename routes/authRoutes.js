var express = require("express");
var router = express.Router();
var authControllers = require("../controllers/authControllers");
var socialAccountControllers = require("../controllers/socialAccountControllers");

router.post("/signup/", authControllers.localSignup);
router.post("/login/", authControllers.localLogin);
router.post("/activate", authControllers.activateAccount);

router.post("/facebook-login", socialAccountControllers.facebookLogin);
router.post("/google-login", socialAccountControllers.googleLogin);

module.exports = router;
