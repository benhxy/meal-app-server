var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MealSchema = new Schema({
  date: {type: Date, default: Date.now},
  time: Number,
  food: String,
  kcal: Number,
  user: {type: Schema.Types.ObjectId, ref:"User"}
},{
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
});

module.exports = mongoose.model("Meal", MealSchema);
