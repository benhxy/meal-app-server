var bcrypt = require("bcrypt");
var User = require("../models/userModel");
var config = require("../config");
var verify = require("../middlewares/sendVerification");

module.exports = {

  readOneOrMany: function(req, res) {

    console.log("=====read user controller=====");

    if (req.query.userId) {

      //read one
      //check permission if not reading self
      if (req.query.userId != req.decoded.userId && (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1)) {
        res.status(403);
        return res.json({message: "No permission to other users"});
      }

      //query db
      User.findById(req.query.userId, function(err, userObj) {
        if (err) {
          res.status(500);
          return res.json({message: "Database error", error: err});
        } else {
          res.status(200);
          return res.json({user: userObj});
        }
      });

    } else {

      //read many
      //check permission
      if (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1) {
        res.status(403);
        return res.json({message: "No permission to other users"});
      }

      //query db (without pulling profile pics)
      User.find({})
      .select("local facebook google role expectedKcal")
      .exec(function(err, userArray) {
        if (err) {
          res.status(500);
          return res.json({message: "Database error", error: err});
        } else {
          res.status(200);
          return res.json({users: userArray});
        }
      });

    }

  },

  createOneLocalAccount: function(req, res) {

    //check permission
    if (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1) {
      res.status(403);
      return res.json({message: "No permission to other users"});
    }

    //check if signup credentials are in request
    let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!req.body.name || !req.body.email || !req.body.password || req.body.name == "" || req.body.email == "" || req.body.password == "" || !req.body.email.match(mailformat)) {
      res.status(400);
      return res.json({message: "Incomplete or incorrect signup information"});
    }

    //check if email exists in database
    let query = User.find({});
    query.or([
      {"local.email": req.body.email},
      {"facebook.email": req.body.email},
      {"google.email": req.body.email}
    ]);
    query.exec((err, user) => {
      if (user != "") {
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
        //create admin or userManager role
        if (req.body.role && (req.body.role == "admin" || req.body.role == "userManager")) {
          if (req.decoded.permissions.indexOf("create-admin") != -1) {
            res.status(403);
            return res.json({message: "No permission to create admin or userManager"});
          } else {
            newUserInfo.role = req.body.role;
          }
        }
        //salt password
        bcrypt.hash(req.body.password, 10).then((hash) => {
          newUserInfo.local.password = hash;
        });
        //save to db
        var newUser = new User(newUserInfo);
        newUser.save((err, createdUser) => {
          if (err) {
            res.status(500);
            return res.json({message: "Database error"});
          } else {
            //set nonce and send verification email
            verify(createdUser);
            res.status(200);
            return res.json({message: "New user created"});
          }
        });

      }
    });

  },

  updateOne: function(req, res) {

    //check permission if not reading self
    if (req.query.userId != req.decoded.userId && (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1)) {
      res.status(403);
      return res.json({message: "No permission to other users"});
    }

    User.findById(req.query.userId, function(err, user) {
      if (err) {
        res.status(500);
        return res.json({message: "Database error"});
      }

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

      //update fields (admin)
      if (req.body.loginFailCount && req.decoded.permissions && req.decoded.permissions.indexOf("user") != -1) {
        user.set({"local.loginFailCount": null});
      }

      //save object
      user.save(function(err, updatedUser) {
        if (err) {
          res.status(500);
          return res.json({message: "Database error"});
        } else {
          res.status(200);
          return res.json({message: "User updated", user: updatedUser});
        }
      });

    });

  },

  deleteOne: function(req, res) {

    //check admin permission
    if (!req.decoded.permissions || req.decoded.permissions.indexOf("users") == -1) {
      res.status(403);
      return res.json({message: "No permission to delete users"});
    }

    //require userId
    if (!req.query.userId) {
      res.status(400);
      return res.json({message: "Missing userId"});
    }

    User.findByIdAndRemove(req.query.userId, function(err, deletedUser) {
      if (err || !deletedUser) {
        res.status(400);
        return res.json({message: "No such user"});
      } else {
        res.status(200);
        return res.json({message: "User deleted", user: deletedUser});
      }
    });

  },

  resendVerification: function(req, res) {

    User.findById(req.decoded.userId, function(err, user) {

      if(err || !user || user == "" || !user.local || !user.local.email) {
        res.status(400);
        return res.json({message: "User does not exist"});
      }
      if (user.local.verified) {
        res.status(400);
        return res.json({message: "User already verified"});
      }

      verify(createdUser);
      res.status(200);
      return res.json({message: "Verification sent"});

    });

  }

};
