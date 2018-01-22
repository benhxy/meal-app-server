var nodemailer = require("nodemailer");
var randomstring = require("randomstring");

var config = require("../config");

var sendInvitation = function(email) {

  console.log("=====send invitation=====");

  //setup mailer
  let transporter = nodemailer.createTransport(config.mailer);

  //set email content
  let emailText = "Come and register! http://localhost:" + config.clientPort + "/auth/signup";

  let mailOptions = {
    from: 'benhu.seattle@gmail.com',
    to: email,
    subject: 'Invitation',
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
