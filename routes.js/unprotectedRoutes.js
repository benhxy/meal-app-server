var express = require("express");
var router = express.Router();
var auth_controller = require("../controllers/authController");

router.post("/api/local-signup/", auth_controller.localSignup);
router.post("/api/local-login/", auth_controller.localLogin);

module.exports = router;
