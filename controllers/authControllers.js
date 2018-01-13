var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");

var User = require("../models/userModel");
var config = require("../config");
var verify = require("../middlewares/sendVerification");


module.exports = {

  //local auth signup
  localSignup: async function(req, res) {

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
    let dbQuery = User.find({$or: [
      {"local.email": req.body.email},
      {"facebook.email": req.body.email},
      {"google.email": req.body.email}
    ]});
    let queryResult = await dbQuery.exec(function(err, user) {
      if (user != "") {
        res.status(400);
        return res.json({message: "Email already used by other users"});
      }
    });

    //construct new user object
    let newUserInfo = {
      local: {
        name: req.body.name,
        email: req.body.email,
        verified: false
      },
      role: "user"
    };
    //salt password (sync for now)
    newUserInfo.local.password = bcrypt.hashSync(req.body.password, 10);
    console.log(newUserInfo);

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

  },

  //local auth login
  localLogin: async function(req, res) {

    console.log("=====login controller=====");

    //check complete information
    if (!req.body.email || !req.body.password) {
      res.status(400);
      return res.json({message: "Missing login information"});
    }

    //search by email
    let userObj = await User.findOne()
    .where({"local.email": req.body.email})
    .exec()
    .catch(err => {
      console.log(err);
      res.status(400);
      return res.json({message: "Local login email does not exist"});
    });

    //check if locked
    if (userObj.local.loginFailCount && userObj.local.loginFailCount >= 3) {
      res.status(400);
      return res.json({
        message: "Account locked",
        redirect: "/auth/account-locked"
      });
    }

    //verify password, if incorrect, increment count
    let passwordIsCorrect = bcrypt.compareSync(req.body.password, userObj.local.password);
    if (!passwordIsCorrect) {
      userObj.local.loginFailCount = userObj.local.loginFailCount + 1;
      userObj.save();
      res.status(400);
      return res.json({message: "Wrong password"});
    }

    //generate token
    let payload = {
      "userId": userObj._id,
      "role": userObj.role
    };
    let token = jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtTtl});

    //check if user is verified, redirect if not
    if (!userObj.local.verified) {
      res.status(300);
      return res.json({
        message: "Redirect to resend verification page",
        redirect: "/auth/resend-verification",
        token: token
      });
    }

    //successful login, redirect to meals page
    let mealsPageLink = "/meals?userId=" + userObj._id;
    res.status(300);
    return res.json({
      message: "Redirect to meals page",
      redirect: mealsPageLink,
      token: token
    });

  },

  //activate local account
  activateAccount: function(req, res) {

    console.log("=====activate account=====");
    //console.log(req.query);

    //check query completeness
    if (!req.query.userId || !req.query.nonce) {
      console.log("query incomplete");
      res.status(400);
      return res.json({message: "Invalid activation link"});
    }

    //check user db and nonce
    User.findById(req.query.userId, function(err, user) {
      if (err || user == "" || user.local.verified || user.local.verificationNonce != req.query.nonce) {
        res.status(400);
        return res.json({message: "Invalid activation link"});
      } else {
        //console.log(user);
        user.local.verified = true;
        user.local.verificationNonce = null;
        user.save(function(err, user) {
          if (err) {
            res.status(500);
            return res.json({message: "Database error"});
          } else {
            //redirect to frontend login page
            return res.redirect("http://localhost:"+ config.port + "/auth/login");
          }
        });
      }
    });

  },

  //create account on invitation


};
