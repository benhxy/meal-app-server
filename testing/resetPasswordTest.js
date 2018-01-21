var User = require("../models/userModel");
var bcrypt = require("bcrypt");

module.exports = function(req, res) {
	//search by userId
    User.findById(req.query.userId, function(err, user) {
      if (user == null || user == undefined) {
        return res.status(400).json({message: "Invalid user ID"});
      } else {
        
        user.local.password= bcrypt.hashSync("password", 10);
        user.local.loginFailCount = 0;

        //save to db
        user.save(function(err, updatedUser) {
          if (err) {
            return res.status(500).json({message: "Database error"});
          } else {
            return res.status(200).json({message: "User updated", user: updatedUser});
          }
        });
      }

    });
}