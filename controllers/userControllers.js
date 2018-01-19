//plugins
var bcrypt = require("bcrypt");
var validator = require("validator");
var randomstring = require("randomstring");
//config
var config = require("../config");
//models
var User = require("../models/userModel");
//middlewares
var sendInvitation = require("../middlewares/sendInvitation");
var sendVerification = require("../middlewares/sendVerification");

module.exports = {

  readOneOrMany: function(req, res) {

    console.log("=====read user controller=====");

    if (req.query.userId) {

      //read one
      //check permission if not reading self
      if (req.query.userId != req.decoded.userId && (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1)) {
        return res.status(403).json({message: "No permission to other users"});
      }

      //query db
      User.findById(req.query.userId, function(err, userObj) {
        if (err) {
          return res.status(500).json({message: "Database error", error: err});
        } else {
          return res.status(200).json({user: userObj});
        }
      });

    } else {

      //read many
      //check permission
      if (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1) {
        return res.status(403).json({message: "No permission to other users"});
      }

      //query db (without pulling profile pics)
      User.find({})
      .select("local facebook google role expectedKcal")
      .exec(function(err, userResult) {
        if (err) {
          return res.status(500).json({message: "Database error", error: err});
        } else {
          //remove unused login account
          let userArray = userResult.map(function(user) {
            let consolidated = {
              role: user.role,
              profilePic: user.profilePic,
              expectedKcal: user.expectedKcal
            };
            console.log(user.facebook.id == undefined);
            if (user.facebook.id != undefined) {
              consolidated.name = user.facebook.name;
              consolidated.email = user.facebook.email;
              consolidated.accountType = "Facebook";
            } else if (user.google.id != undefined) {
              consolidated.name = user.google.name;
              consolidated.email = user.google.email;
              consolidated.accountType = "Google";
            } else {
              consolidated.name = user.local.name;
              consolidated.email = user.local.email;
              consolidated.accountType = "Local";
            }
            return consolidated;
          });
          return res.status(200).json({users: userArray});
        }
      });

    }

  },

  createOneLocalAccount: function(req, res) {
    //create a user with any role, without verification
    //database hit: 2

    //check permission
    if (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1) {
      return res.status(403).json({message: "No permission to other users"});
    }

    //check signup information
    if (!req.body.name || !req.body.email || !req.body.password || req.body.name == "" || req.body.email == "" || req.body.password == "" || !validator.isEmail(req.body.email || config[req.body.role] == undefined)) {
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
        //create user object
        let newUserInfo = {
          local: {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            verified: true
          },
          role: req.body.role
        };

        //save to db
        let newUser = new User(newUserInfo);
        newUser.save((err, createdUser) => {
          if (err) {
            return res.status(500).json({message: "Database error"});
          } else {
            return res.status(200).json({message: "New user created", user: createdUser});
          }
        });
      }
    });

  },

  createOneLocalAccountAndInvite: function(req, res) {
    //create a user account (user role only) and send invitation email. not verified
    //database hit: 2

    //check admin permission
    if (req.decoded.permissions.indexOf("send-invitation") == -1) {
      return res.status(403).json({message: "No permission to send invitation"});
    }

    //check signup information
    if (!req.body.name || !req.body.email || req.body.name == "" || req.body.email == "" || !validator.isEmail(req.body.email)) {
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
        //create user object
        let tempPassword = randomstring.generate(20);
        let newUserInfo = {
          local: {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(tempPassword, 10),
            verified: false,
            verificationNonce: randomstring.generate(20)
          },
          role: "user"
        }

        //save to db
        let newUser = new User(newUserInfo);
        newUser.save((err, createdUser) => {
          if (err) {
            return res.status(500).json({message: "Database error"});
          } else {
            sendInvitation(createdUser);
            return res.status(200).json({message: "New user created", user: createdUser});
          }
        });
      }
    })

  },

  updateOne: function(req, res) {
    //update user by self or admin
    //database hit: 2

    //check permission if not reading self
    if (req.query.userId != req.decoded.userId && (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1)) {
      return res.status(403).json({message: "No permission to other users"});
    }

    //search by userId
    User.findById(req.query.userId, function(err, user) {
      if (user == null || user == undefined) {
        return res.status(400).json({message: "Invalid user ID"});
      } else {
        
        //update fields (self)
        if (req.body.name) {
          user.set({"local.name": req.body.name});
        }
        if (req.body.password) {
          bcrypt.hash(req.body.password, 10).then((hash) => {
            user.set({"local.password": hash});
          });
        }
        if (req.body.expectedKcal) {
          user.set({"expectedKcal": req.body.expectedKcal});
        }
        if (req.body.profilePic) {
          user.set({"profilePic": req.body.profilePic});
        }

        //update fields (admin only)
        if (req.decoded.permissions && req.decoded.permissions.indexOf("users") != -1) {
          if (req.body.loginFailCount) {
            user.set({"local.loginFailCount": req.body.loginFailCount});
          }

          if (req.body.role && config.roles[req.body.role] != undefined) {
            user.set({"role": req.body.role});
          }
        }

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
    
  },

  deleteOne: function(req, res) {
    //delete user by admin
    //database hit: 1

    //check admin permission
    if (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1) {
      return res.status(403).json({message: "No permission to delete users"});
    }

    //require userId
    if (!req.query.userId) {
      return res.status(400).json({message: "Missing userId"});
    }

    User.findByIdAndRemove(req.query.userId, function(err, deletedUser) {
      if (err || !deletedUser) {
        return res.status(400).json({message: "No such user"});
      } else {
        return res.status(200).json({message: "User deleted", user: deletedUser});
      }
    });

  },

  resendVerification: function(req, res) {
    //resend verification by user
    //database hit: 1

    User.findById(req.decoded.userId, function(err, user) {

      if(err || !user || user == "" || !user.local || !user.local.email) {
        return res.status(400).json({message: "User does not exist"});
      }
      if (user.local.verified) {
        return res.status(400).json({message: "User already verified"});
      }

      sendVerification(user);
      return res.status(200).json({message: "Verification sent"});

    });

  },

};
