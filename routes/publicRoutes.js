var express = require("express");
var router = express.Router();
var authControllers = require("../controllers/authControllers");

router.post("/local-signup/", authControllers.localSignup);
router.post("/local-login/", authControllers.localLogin);

module.exports = router;
