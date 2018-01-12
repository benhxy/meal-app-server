var jwt = require("jsonwebtoken");
var User = require("../models/userModel");
var config = require("../config");

var verifyJwt = function (req, res, next) {

  console.log("=====verify jwt middleware=====");

  //check token exist
  var token = req.headers.token || req.headers['x-access-token'];
  if (!token) {
    res.status(401);
    return res.json({message: "No token provided"});
  }

  //validate token
  let decodedToken = {};
  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      console.log(err);
      res.status(401);
      return res.json({message: "Token validation failed"});
    } else {
      //populate userId and permissions
      req.decoded = {}; //important, must initiate object first
      req.decoded.userId = decoded.userId;
      req.decoded.permissions = config.roles[decoded.role];
    }
  });

  console.log(req.decoded);
  console.log("Verify successful");

  //check if user is verified or unlocked, redirect if not
  let dbQuery = User.findById(req.decoded.userId);
  let redirect = dbQuery.exec(function(err, user) {
    if (err || user == "") {
      res.status(500);
      return res.json({message: "Database error", error: err});
    }
    if (!user.local.verified) {
      res.status(300);
      return res.json({
        message: "Redirect to resend verification page",
        redirect: "/auth/resend-verification"
      });
    }
    if (user.local.loginFailCount && user.local.loginFailCount >= 3) {
      res.status(300);
      return res.json({
        message: "Redirect to account locked page",
        redirect: "/auth/account-locked"
      });
    }

    next();
  });

};

module.exports = verifyJwt;
