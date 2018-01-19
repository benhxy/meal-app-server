var express = require("express");
var router = express.Router();
var authControllers = require("../controllers/authControllers");

router.post("/signup/", authControllers.localSignup);
router.post("/login/", authControllers.localLogin);
router.get("/activate-account", authControllers.activateAccount);

router.post("/facebook-login", authControllers.facebookLogin);

module.exports = router;
