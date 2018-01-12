var express = require("express");
var router = express.Router();
var userControllers = require("../controllers/userControllers");

//verify token
var verifyJwt = require("../middlewares/verifyJwt");
router.use(verifyJwt);

router.get("/", userControllers.readOneOrMany);
router.post("/", userControllers.createOneLocalAccount);
router.put("/", userControllers.updateOne);
router.delete("/", userControllers.deleteOne);
router.get("/resend-verification", userControllers.resendVerification);

module.exports = router;
