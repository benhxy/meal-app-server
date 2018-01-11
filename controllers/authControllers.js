var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");

var verify = require("../middlewares/sendVerification");
var User = require("../models/userModel");
var config = require("../config");


module.exports = {

  //local auth signup
  localSignup: function(req, res) {

    //check if login credentials are in request
    if (!req.body.name || !req.body.email || !req.body.password || req.body.name == "" || req.body.email == "" || req.body.password == "") {
      res.status(400);
      return res.json({message: "Missing signup information"});
    }

    //check if email exists in database
    let query = User.find({});
    query.or([
      {"local.email": req.body.email},
      {"facebook.email": req.body.email},
      {"google.email": req.body.email}
    ]);
    query.exec((err, user) => {
      if (user) {
        res.status(400);
        return res.json({message: "This email is already in use"});
      } else {

        //construct new user object
        let newUserInfo = {
          local: {
            name: req.body.name,
            email: req.body.email,
            verified: false
          },
          role: "user"
        };
        //salt password
        bcrypt.hash(req.body.password, 10).then((hash) => {
          newUserInfo.local.password = hash;
        });
        //save to db
        var newUser = new User(newUserInfo);
        newUser.save((err, user) => {
          if (err) {
            res.status(500);
            return res.json({message: "Fail to create user in database"});
          } else {
            //set nonce and send verification email
            verify(user);
          }
        });

      }
    });

  },

  //local auth login
  localLogin: function(req, res) {

  },

  //resent verification email
  resentVerification: function(req, res) {

  }

};
