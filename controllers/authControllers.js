//plugins
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var randomstring = require("randomstring");
var validator = require("validator");
var axios = require("axios");
//config
var config = require("../config");
//models
var User = require("../models/userModel");
//middlewares
var sendInvitation = require("../utilities/sendInvitation");
var sendVerification = require("../utilities/sendVerification");

module.exports = {

  //local auth signup
  localSignup: async function(req, res) {

    console.log("=====localSignup=====");

    //check signup information
    if (!req.body.name || !req.body.email || !req.body.password || req.body.name == "" || req.body.email == "" || req.body.password == "" || !validator.isEmail(req.body.email)) {
      return res.status(400).json({message: "Incomplete or incorrect signup information"});
    }

    //check if email exists in database
    User.findOne({$or: [
      {"local.email": req.body.email},
      {"facebook.email": req.body.email},
      {"google.email": req.body.email}
    ]}, function(err, user) {
      if (user != null || user != undefined) {
        return res.status(400).json({message: "This email is already in use"});
      } else {
        //construct new user object
        //hash password
        //generate verification nonce
        let newUserInfo = {
          local: {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            verificationNonce: randomstring.generate(20)
          }
        };

        //save to db
        let newUser = new User(newUserInfo);
        newUser.save((err, createdUser) => {
          if (err) {
            return res.status(500).json({message: "Fail to create user in database"});
          } else {
            //set nonce and send verification email
            sendVerification(createdUser);
            //redirect to resend page
            return res.json({
              message: "Redirect to login page",
              redirect: "/auth/login"
            });
          }
        });
      }
    })
    
  },

  //local auth login
  localLogin: async function(req, res) {

    console.log("=====login controller=====");

    //check complete information
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({message: "Missing login information"});
    }

    //search by email
    let userObj = await User.findOne({"local.email": req.body.email}, function(err, userObj) {
      if (userObj == null) {
        return res.status(400).json({message: "Local login email does not exist"});
      } else {

            //check if locked
        if (userObj.local.loginFailCount && userObj.local.loginFailCount >= 3) {
          return res.status(400).json({message: "Your account is locked"});
        }

        //check if verified
        if (!userObj.local.verified) {
          return res.status(400).json({message: "Your email is not yet verified"});
        }

        //check password, if incorrect, increment count
        console.log(req.body.password)

        let passwordIsCorrect = bcrypt.compareSync(req.body.password, userObj.local.password);
        if (!passwordIsCorrect) {
          userObj.local.loginFailCount = userObj.local.loginFailCount + 1;
          userObj.save();
          return res.status(400).json({message: "Wrong password"});
        }

        //generate token
        let payload = {
          "userId": userObj._id,
          "role": userObj.role
        };
        let token = jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtTtl});

        //successful login, redirect to meals page
        return res.json({
          message: "Login successdul, redirect to meals page",
          redirect: "/meals",
          token: token,
          role: userObj.role,
          userId: userObj._id,
          expectedKcal: userObj.expectedKcal
        });

      }
    });
  },

  //activate local account
  activateAccount: function(req, res) {

    console.log("=====activate account=====");
    //console.log(req.query);

    //check query completeness
    if (!req.query.userId || !req.query.nonce) {
      console.log("query incomplete");
      return res.status(400).send("Invalid activation link");
    }

    //check user db and nonce
    User.findById(req.query.userId, function(err, user) {
      if (user == null || use == undefined || user.local.verificationNonce == null || user.local.verificationNonce != req.query.nonce) {
        return res.status(400).send("Invalid activation link");
      } else {
        //console.log(user);
        user.local.verified = true;
        user.local.verificationNonce = null;
        user.save(function(err, updatedUser) {
          if (err) {
            return res.status(500).send("Database error");
          } else {
            //redirect to frontend login page
            return res.redirect("http://localhost:"+ config.clientPort + "/auth/login");
          }
        });
      }
    });

  },

};
