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
var sendInvitation = require("../middlewares/sendInvitation");
var sendVerification = require("../middlewares/sendVerification");

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
            verified: false,
            loginFailCount: 0,
            verificationNonce: randomstring.generate(20)
          },
          role: "user",
          expectedKcal: 0
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
    let userObj = await User.findOne({"local.email": req.body.email}, function(err, user) {
      if (user == null || user == undefined) {
        return res.status(400).json({message: "Local login email does not exist"});
      }
    });

    //check if locked
    if (userObj.local.loginFailCount && userObj.local.loginFailCount >= 3) {
      return res.status(400).json({message: "Your account is locked"});
    }

    //check if verified
    if (!userObj.local.verified) {
      return res.status(400).json({message: "Your email is not yet verified"});
    }

    //check password, if incorrect, increment count
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

  facebookLogin: function(req, res) {

    console.log("=====facebook login=====");

/* Implement token inspection in the future
    //get app access token
    if (config.facebookAppAccessToken == "") {
      let fbTokenLink = "https://graph.facebook.com/oauth/access_token?client_id=" + config.facebookAppId + "&client_secret=" + config.facebookAppSecret + "&grant_type=client_credentials";
      axios.get(fbTokenLink)
        .then(response => {
          config.facebookAppAccessToken = response.data.access_token;
        })
        .catch(err => console.log(err.response.headers));
    }

    let fbObj = req.body.fbObj;
    let fbValidLink = "https://graph.facebook.com/debug_token?" + 
      "input_token=" + fbObj.accessToken + 
      "&access_token=" + config.facebookAppAccessToken;
    
    axios.get(fbValidLink)
      .then(response =>  {
        console.log(response.data)
      })
      .catch(err => console.log(err.response.headers));
*/

    //check email exists
    User.findOne({$or: [
      {"local.email": req.body.email},
      {"facebook.email": req.body.email},
      {"google.email": req.body.email}
    ]}, function(err, user) {
      if (user == null || user == undefined) {
        //create user now
        let newUserInfo = {
          local: {
            verified: true
          },
          facebook: {
            id: req.body.id,
            token: req.body.accessToken,
            email: req.body.email,
            name: req.body.name
          },
          role: "user"
        };

        let newUser = new User(newUserInfo);
        newUser.save(function(err, createdUser) {
          if (err) {
            return res.status(500).json({message: "Fail to create user in database"});
          } else {
            //provide token and redirect
            let payload = {
              "userId": createdUser._id,
              "role": createdUser.role
            };
            let token = jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtTtl});
            return res.json({
              message: "Login successdul, redirect to meals page",
              redirect: "/meals",
              token: token,
              role: createdUser.role,
              userId: createdUser._id,
              expectedKcal: createdUser.expectedKcal
            });
          }
        });

      } else {

        //set user verified
        if (user.local.verified == false) {
          user.set({"local.verified": true});
        }

        //insert facebook account info
        if (user.facebook.id == undefined) {
          user.set({
            "facebook.id": req.body.id, 
            "facebook.token": req.body.accessToken,
            "facebook.name": req.body.name, 
            "facebook.email": req.body.email
          });
          user.save();
        }

        //provide token and redirect
        let payload = {
          "userId": user._id,
          "role": user.role
        };
        let token = jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtTtl});
        return res.json({
          message: "Login successdul, redirect to meals page",
          redirect: "/meals",
          token: token,
          role: user.role,
          userId: user._id,
          expectedKcal: user.expectedKcal
        });
        
      }
    });
  },

  googleLogin: function(req, res) {

    console.log("=====google login=====");

    //check email exists
    User.findOne({$or: [
      {"local.email": req.body.email},
      {"facebook.email": req.body.email},
      {"google.email": req.body.email}
    ]}, function(err, user) {
      if (user == null || user == undefined) {
        //create user now
        let newUserInfo = {
          local: {
            verified: true
          },
          google: {
            id: req.body.id,
            token: req.body.accessToken,
            email: req.body.email,
            name: req.body.name
          },
          role: "user"
        };

        let newUser = new User(newUserInfo);
        newUser.save(function(err, createdUser) {
          if (err) {
            return res.status(500).json({message: "Fail to create user in database"});
          } else {
            //provide token and redirect
            let payload = {
              "userId": createdUser._id,
              "role": createdUser.role
            };
            let token = jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtTtl});
            return res.json({
              message: "Login successdul, redirect to meals page",
              redirect: "/meals",
              token: token,
              role: createdUser.role,
              userId: createdUser._id,
              expectedKcal: createdUser.expectedKcal
            });
          }
        });

      } else {

        //set user verified
        if (user.local.verified == false) {
          user.set({"local.verified": true});
        }

        //insert google account info
        if (user.google.id == undefined) {
          user.set({
            "google.id": req.body.id, 
            "google.token": req.body.accessToken,
            "google.name": req.body.name, 
            "google.email": req.body.email
          });
          user.save();
        }

        //provide token and redirect
        let payload = {
          "userId": user._id,
          "role": user.role
        };
        let token = jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtTtl});
        return res.json({
          message: "Login successdul, redirect to meals page",
          redirect: "/meals",
          token: token,
          role: user.role,
          userId: user._id,
          expectedKcal: user.expectedKcal
        });
        
      }
    });
  },

};
