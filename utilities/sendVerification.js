var nodemailer = require("nodemailer");
var randomstring = require("randomstring");

var config = require("../config");

var sendVerification = function(user) {

  console.log("=====send verfication=====");

  let userId = user._id;
  let email = user.local.email;
  let nonce = user.local.verificationNonce;

  //setup mailer
  let transporter = nodemailer.createTransport(config.mailer);

  //set email content
  let emailText = "Click this to activate your account: http://localhost:" + config.port + "/api/public/activate-account?userId=" + userId + "&nonce=" + nonce;
  let mailOptions = {
    from: 'benhu.seattle@gmail.com',
    to: email,
    subject: 'Verification email',
    text: emailText
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
