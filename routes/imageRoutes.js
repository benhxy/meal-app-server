var express = require("express");
var router = express.Router();
var imageControllers = require("../controllers/imageControllers");

//verify token
var verifyJwt = require("../utilities/verifyJwt");
router.use(verifyJwt);

//upload file
var path = require('path');
var multer = require("multer");
var upload = multer({dest: path.resolve(__dirname, "../upload")});

router.get("/", imageControllers.readOne);
router.post("/", upload.single("file"), imageControllers.createOne);

module.exports = router;