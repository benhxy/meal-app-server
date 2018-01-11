var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");

var User = require("../models/userModel");
var config = require("../config");
var verify = require("../middlewares/sendVerification");


module.exports = {

  //local auth signup
  localSignup: function(req, res) {

    console.log("=====localSignup=====");

    //check if signup credentials are in request
    //let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    //let email = req.body.email;
    //console.log(email.match(mailformat));
    if (!req.body.name || !req.body.email || !req.body.password || req.body.name == "" || req.body.email == "" || req.body.password == "") {
      res.status(400);
      return res.json({message: "Incomplete or incorrect signup information"});
    }

    //check if email exists in database
    User.find({$or: [
      {"local.email": req.body.email},
      {"facebook.email": req.body.email},
      {"google.email": req.body.email}
    ]}, function(err, user) {
      if (user != "") {
        res.status(400);
        return res.json({message: "Email already used by other users"});
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
        console.log(newUserInfo);

        //salt password (sync for now)
        newUserInfo.local.password = bcrypt.hashSync(req.body.password, 10);
        //save to db
        var newUser = new User(newUserInfo);
        newUser.save((err, createdUser) => {
          if (err) {
            res.status(500);
            return res.json({message: "Fail to create user in database"});
          } else {
            //set nonce and send verification email
            verify(createdUser);
            //redirect to resend page
            res.status(300);
            return res.json({
              message: "Redirect to resend verification",
              redirect: "/auth/resend-verification"
            });
          }
        });

      }
    });

  },

  //local auth login
  localLogin: function(req, res) {

    //check complete information
    if (!req.body.email || !req.body.password) {
      res.status(400);
      return res.json({message: "Missing login information"});
    }

    //check email and password
    User.findOne({"local.email": req.body.email}, function(err, user) {
      if (err || user == "") {
        res.status(400);
        return res.json({message: "Local login email does not exist"});
      }

      //verify password
      let passwordIsCorrect = bcrypt.compareSync(req.body.password, user.local.password);
      if (!passwordIsCorrect) {
        res.status(400);
        return res.json({message: "Wrong password"});
      }

      //generate token
      let payload = {
        "userId": user._id,
        "role": user.role
      };
      let token = jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtTtl});

      //check if user is verified or unlocked, redirect if not
      if (!user.local.verified) {
        res.status(300);
        return res.json({
          message: "Redirect to resend verification page",
          redirect: "/auth/resend-verification",
          token: token
        });
      } else if (user.local.loginFailCount && user.local.loginFailCount >= 3) {
        res.status(300);
        return res.json({
          message: "Redirect to account locked page",
          redirect: "/auth/account-locked",
          token: token
        });
      } else {
        //successful login, redirect to meals page
        let mealsPageLink = "/meals?userId=" + user._id;
        res.status(300);
        return res.json({
          message: "Redirect to meals page",
          redirect: mealsPageLink,
          token: token
        });
      }

    });

  }

};
