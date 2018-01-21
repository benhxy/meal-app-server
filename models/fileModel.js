var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
var Schema = mongoose.Schema;

var FileSchema = new Schema({
  profilePic: {
    data: Buffer,
    contentType: String
  }
});

module.exports = mongoose.model("File", FileSchema);
