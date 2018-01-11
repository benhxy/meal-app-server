var jwt = require("jsonwebtoken");
var config = require("../config");

var jwtAuth = function (req, res, next) {

  //check token exist
  var token = req.headers.token || req.headers['x-access-token'];
  if (!token) {
    //401: unauthenticated
    res.status(401);
    return res.json({message: "No token provided"});
  }

  //validate token
  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err || ) {
      //401: unauthenticated
      res.status(401);
      return res.json({message: "Token validation failed"});
    } else if (!decoded.permissions) {
      //401: unauthenticated
      res.status(401);
      return res.json({message: "Token without permissions"});
    } else {
      req.permissions = decoded.permissions;
    }
  })

  next();

};

module.exports = jwtAuth;
