var axios = require("axios");
var moment = require("moment");
var Meal = require("../models/mealModel");
var ObjectId = require("mongoose").Types.ObjectId;

var config = require("../config");
var verify = require("../middlewares/sendVerification");

module.exports = {

  readMany: function(req, res) {

    console.log("=====view meal records=====")

    //read one user's meals
    if (req.query.userId) {

      //if query others' meals, check permission
      if (req.query.userId != req.decoded.userId && req.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      }

      //query db
      Meal.find({"user": new ObjectId(req.query.userId)
      }, function(err, mealArray) {
        if (mealArray != null) {
          return res.status(200).json({meals: mealArray});
        } else {
          return res.status(500).json({message: "Database error"});
        }
      });

    } else {

      //check admin permission
      if (req.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      }

      //query db
      Meal.find({}, function(err, mealArray) {
        if (mealArray != null) {
          return res.status(200).json({meals: mealArray});
        } else {
          return res.status(500).json({message: "Database error"});
        }
      });

    }

  },

  createOne: async function(req, res) {

    let mealObj = {};

    //create for other users
    if (req.body.userId && req.body.userId != req.decoded.userId) {
      //check admin permission
      if (req.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      } else {
        mealObj.user = new ObjectId(req.body.userId);
      }
    } else {
      mealObj.user = new ObjectId(req.decoded.userId);
    }

    //check completeness
    if (!req.body.date || !req.body.time || !req.body.food) {
      return res.status(400).json({message: "Incomplete meal information"});
    }

    mealObj.date = moment(req.body.date);
    mealObj.time = req.body.time;
    mealObj.food = req.body.food;
    if (req.body.kcal) {
      mealObj.kcal = req.body.kcal;
    } else {
      //query external API
    }

    //save to db
    let newMeal = new Meal(mealObj);
    newMeal.save(function(err, savedMeal) {
      if (err) {
        return res.status(500).json({message: "Database error"});
      } else {
        return res.status(200).json({message: "Meal created", meal: savedMeal});
      }
    });

  },

  updateOne: function(req, res) {

    //check meal id
    if (!req.body.mealId) {
      return res.status(400).json({message: "Missing record ID"});
    }

    //check time within range
    if (req.body.time && (req.body.time < 0 || req.body.time >= 1440)) {
      return res.status(400).json({message: "Time out of range"});
    }

    Meal.findById(req.body.mealId, function(err, meal) {

      if (err || meal == "") {
        return res.status(400).json({message: "Record does not exist"});
      }

      //check permission if editing other user's record
      if (!meal.user.equals(res.decoded.userId) && res.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      }

      //update object
      if (req.body.date) {
        meal.date = req.body.date;
      }
      if (req.body.time) {
        meal.time = req.body.time;
      }
      if (req.body.food) {
        meal.food = req.body.food;
      }
      if (req.body.kcal) {
        meal.kcal = req.body.kcal;
      }

      //save to db
      meal.save(function(err, updatedMeal) {
        if (err || updatedMeal == "") {
          return res.status(500).json({message: "Database error"});
        } else {
          return res.status(200).json({message: "Record updated", meal: updatedMeal});
        }
      });

    });

  },

  deleteOne: function(req, res) {

    //check meal
    if (!req.body.mealId) {
      return res.status(400).json({message: "Missing record ID"});
    }

    Meal.findById(req.body.mealId, function(err, meal) {

      //check permission if editing other user's record
      if (!meal.user.equals(res.decoded.userId) && res.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      }

      //remove doc
      meal.remove(function(err, deletedMeal) {
        if (err) {
          return res.status(500).json({message: "Database error"});
        } else {
          return res.status(200).json({message: "Record deleted", meal: deletedMeal});
        }
      });

    });

  }


};
