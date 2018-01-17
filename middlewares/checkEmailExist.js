var User = require("../models/userModel");

var checkEmailExist = async function(email) {

  //check if email exists in database
  let dbQuery = User.find({$or: [
    {"local.email": email},
    {"facebook.email": email},
    {"google.email": email}
  ]});

  let queryResult = await dbQuery.exec(function(err, user) {
    if (err) {
      return false;
    }
  });

  return true;

};

module.exports = checkEmailExist;
