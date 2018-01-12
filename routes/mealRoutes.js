var express = require("express");
var router = express.Router();
var mealControllers = require("../controllers/mealControllers");

//verify token
var verifyJwt = require("../middlewares/verifyJwt");
router.use(verifyJwt);

//routes
router.get("/", mealControllers.readMany);
router.post("/", mealControllers.createOne);
router.put("/", mealControllers.updateOne);
router.delete("/", mealControllers.deleteOne);


module.exports = router;
