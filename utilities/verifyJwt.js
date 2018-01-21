var jwt = require("jsonwebtoken");
var User = require("../models/userModel");
var config = require("../config");

var verifyJwt = function (req, res, next) {

  console.log("=====verify jwt middleware=====");

  //check token exist
  var token = req.headers.token || req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({message: "No token provided"});
  }

  //validate token
  let decodedToken = {};
  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).json({message: "Token validation failed"});
    } else {
      //populate userId and permissions
      req.decoded = {}; //important, must initiate object first
      req.decoded.userId = decoded.userId;
      req.decoded.permissions = config.roles[decoded.role];
    }
  });

  //check if user is verified or unlocked, redirect if not
  let dbQuery = User.findById(req.decoded.userId);
  let redirect = dbQuery.exec(function(err, user) {
    if (err || user == "") {
      return res.status(500).json({message: "Database error", error: err});
    }
    if (!user.local.verified) {
      return res.status(400).json({
        message: "Your email is not verified yet"
      });
    }
    if (user.local.loginFailCount && user.local.loginFailCount >= 3) {
      return res.status(400).json({
        message: "Your account is locked. Please contact admin to unlock."
      });
    }

    next();
  });

};

module.exports = verifyJwt;
