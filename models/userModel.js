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
    profilePicUrl: String,
  },
  google           : {
    id: String,
    token: String,
    email: String,
    name: String,
    profilePicUrl: String,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "userManager", "admin"],
    default: "user"
  },
  profilePic: {
    type: Schema.Types.ObjectId, 
    ref:"Image"},
  expectedKcal: {
    type: Number,
    default: 2000
  }
});

module.exports = mongoose.model("User", UserSchema);
