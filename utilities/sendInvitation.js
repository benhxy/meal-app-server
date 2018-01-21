var nodemailer = require("nodemailer");
var randomstring = require("randomstring");

var config = require("../config");

var sendInvitation = function(user, tempPassword) {

  console.log("=====send verfication=====");
  console.log(user);

  let userId = user._id;
  let email = user.local.email;
  let nonce = user.local.verificationNonce;

  //setup mailer
  let transporter = nodemailer.createTransport(config.mailer);

  //set email content
  let emailText = "Click this to activate your account: http://localhost:" + config.port + "/api/public/activate-account?userId=" + userId + "&nonce=" + nonce + "\nYour temporary password is: " + tenpPassword;

  let mailOptions = {
    from: 'benhu.seattle@gmail.com',
    to: email,
    subject: 'Invitation email',
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

module.exports = sendInvitation;
