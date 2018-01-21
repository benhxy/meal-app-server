var jwt = require("jsonwebtoken");
var axios = require("axios");

var User = require("../models/userModel");
var config = require("../config");

module.exports = {

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

            //get facebook profile picture





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
