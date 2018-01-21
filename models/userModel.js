var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  local: {
    name: String,
    email: String,
    password: String,
    verified: {
      type: Boolean,
      default: false
    },
    verificationNonce: String,
    loginFailCount: {
      type: Number,
      default: 0
    },
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
    enum: ["user", "userManager", "admin"],
    default: "user"
  },
  profilePic: {
    data: Buffer,
    contentType: String
  },
  expectedKcal: {
    type: Number,
    default: 2000
  }
});

module.exports = mongoose.model("User", UserSchema);
