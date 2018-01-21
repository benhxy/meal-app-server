var express = require("express");
var router = express.Router();
var userControllers = require("../controllers/userControllers");

//verify token
var verifyJwt = require("../utilities/verifyJwt");
router.use(verifyJwt);

//routes
router.get("/", userControllers.readOneOrMany);

router.post("/", userControllers.createOneLocalAccount);
router.post("/send-invitation", userControllers.createOneLocalAccountAndInvite);

router.put("/", userControllers.updateOne);

router.delete("/", userControllers.deleteOne);

module.exports = router;
