var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  local: {
    name: String,
    email: String,
    password: String,
    verified: Boolean,
    verificationNonce: String,
    verificationLastSent: Date,
    loginFailCount: Number,
  },
  facebook         : {
      id           : String,
      token        : String,
      name         : String,
      email        : String
  },
  google           : {
      id           : String,
      token        : String,
      email        : String,
      name         : String
  },
  role: { type: String,
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
