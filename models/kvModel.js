var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var KvSchema = new Schema({
  key: String,
  value: String
});

module.exports = mongoose.model("Kv", KvSchema);
