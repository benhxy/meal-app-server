var axios = require("axios");
var Meal = require("../models/mealModel");
var config = require("../config");
var verify = require("../middlewares/sendVerification");

module.exports = {

  readMany: function(req, res) {

    //read one user's meals
    if (req.query.userId) {

      //if query others' meals, check permission
      if (req.query.userId != req.decoded.userId && req.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      }

      //create filter
      let filter = {
        "date": {},
        "time": {},
        "user": ObjectId(req.query.userId),
      };
      if (req.query.fromDate) {
        filter.date.$gte = req.query.fromDate;
      }
      if (req.query.toDate) {
        filter.date.$lte = req.query.toDate;
      }
      if (req.query.fromTime) {
        filter.date.$gte = req.query.fromTime;
      }
      if (req.query.toTime) {
        filter.date.$lte = req.query.toTime;
      }

      //query db
      Meal.find(filter, function(err, mealArray) {
        if (err) {
          return res.status(500).json({message: "Database error"});
        } else {
          return res.status(200).json({meals: mealArray});
        }
      });

    } else {

      //check admin permission
      if (req.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      }

      //create filter
      let filter = {
        "date": {},
        "time": {}
      };
      if (req.query.fromDate) {
        filter.date.$gte = req.query.fromDate;
      }
      if (req.query.toDate) {
        filter.date.$lte = req.query.toDate;
      }
      if (req.query.fromTime) {
        filter.date.$gte = req.query.fromTime;
      }
      if (req.query.toTime) {
        filter.date.$lte = req.query.toTime;
      }

      //query db
      Meal.find(filter, function(err, mealArray) {
        if (err) {
          return res.status(500).json({message: "Database error"});
        } else {
          return res.status(200).json({meals: mealArray});
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
        mealObj.user = ObjectId(req.body.userId);
      }
    }

    //check completeness
    if (!req.body.date || !req.body.time || !req.body.food) {
      return res.status(400).json({message: "Incomplete meal information"});
    }

    //check time within range
    if (req.body.time < 0 || req.body.time >= 1440) {
      return res.status(400).json({message: "Time out of range"});
    }

    mealObj.date = req.body.date;
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
