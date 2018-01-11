var express = require("express");
var router = express.Router();
var userControllers = require("../controllers/userControllers");

//verify token
var verifyJwt = require("../middlewares/verifyJwt");
router.use(verifyJwt);

router.get("/", userControllers.readOneOrMany);

module.exports = router;
