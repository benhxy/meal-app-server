var nodemailer = require("nodemailer");
var randomstring = require("randomstring");

var config = require("../config");
var User = require("../models/userModel");

var sendVerification = function(user) {

  console.log("=====send verfication=====");
  console.log(user);

  let email = user.local.email;
  let name = user.local.name;
  let userId = user._id;

  //generate and save nonce to db
  let nonce = randomstring.generate(20);
  User.findByIdAndUpdate(userId, {"local.verificationNonce": nonce}, function(err, user) {
    if (err || user == "") {
      console.log(err);
      res.status(500);
      return res.json({message: "Database error"});
    }
  });

  //setup mailer
  let transporter = nodemailer.createTransport(config.mailer);

  //set email content
  let activationLink = "http://localhost:" + config.port + "/api/public/activate-account?userId=" + userId + "&nonce=" + nonce;
  let mailOptions = {
    from: 'benhu.seattle@gmail.com',
    to: email,
    subject: 'Verification email',
    text: activationLink
  };

  //send email
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  
};

module.exports = sendVerification;
