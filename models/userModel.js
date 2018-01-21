var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  local: {
    name: String,
    email: String,
    password: String,
    verified: Boolean,
    verificationNonce: String,
    loginFailCount: Number,
  },
  facebook         : {
    id: String,
    token: String,
    email: String,
    name: String,
  },
  google           : {
    id: String,
    token: String,
    email: String,
    name: String,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "userManager", "admin"]
  },
  profilePic: {
    data: Buffer,
    contentType: String
  },
  expectedKcal: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("User", UserSchema);
