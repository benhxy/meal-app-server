var express = require("express");
var router = express.Router();
var updateProfilePic = require("../utilities/updateProfilePic");

//verify token
var verifyJwt = require("../utilities/verifyJwt");
router.use(verifyJwt);

//upload file
var path = require('path');
var multer = require("multer");
var upload = multer({dest: path.resolve(__dirname, "../upload")});

router.post("/upload-profile-pic", upload.single("file"), updateProfilePic.localUpload);

module.exports = router;
