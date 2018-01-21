var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');

var Schema = mongoose.Schema;

var MealSchema = new Schema({
  date: Date,
  time: String,
  food: String,
  kcal: Number,
  user: {type: Schema.Types.ObjectId, ref:"User"}
},{
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
});

module.exports = mongoose.model("Meal", MealSchema);
