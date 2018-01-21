var express = require("express");
var router = express.Router();
var updateProfilePic = require("../utilities/updateProfilePic");

//verify token
var verifyJwt = require("../utilities/verifyJwt");
router.use(verifyJwt);

router.post("/upload-profile-pic", updateProfilePic.localUpload);

module.exports = router;
