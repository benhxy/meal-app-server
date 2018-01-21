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
      Meal
        .find({"user": new ObjectId(req.query.userId)
        })
        .exec(function(err, mealArray) {
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

    console.log("=====create meal record=====");

    let mealObj = {};

    //create for other users
    if (req.body.user && (req.body.user != req.decoded.userId)) {
      //check admin permission
      if (req.decoded.permissions.indexOf("all-meals") == -1) {
        return res.status(403).json({message: "No permission to others' records"});
      } else {
        mealObj.user = new ObjectId(req.body.user);
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
    if (req.body.kcal || req.body.kcal != "") {
      mealObj.kcal = req.body.kcal;

      //save to db
        let newMeal = new Meal(mealObj);
        newMeal.save(function(err, savedMeal) {
          if (err) {
            return res.status(500).json({message: "Database error"});
          } else {
            return res.status(200).json({message: "Record created", meal: savedMeal});
          }
        });
        
    } else {

      console.log("=====getting calories=====")
      
      axios.post(
        config.nutritionix.url, 
        {"query": req.body.food}, 
        {headers: config.nutritionix.headers}
        )
      .then(response => {
        //console.log(response.data.foods);
        let foodList = response.data.foods;
        let totalCalories = 0;
        for (let i = 0; i < foodList.length; i++) {
          totalCalories += foodList[i].nf_calories;
        }
        mealObj.kcal = totalCalories;

        //save to db
        let newMeal = new Meal(mealObj);
        newMeal.save(function(err, savedMeal) {
          if (err) {
            return res.status(500).json({message: "Database error"});
          } else {
            return res.status(200).json({message: "Record created", meal: savedMeal});
          }
        });

      })
      .catch(err => {
        let nutritionixError = err.response.data.message;
        mealObj.kcal = 0;

        //save to db
        let newMeal = new Meal(mealObj);
        newMeal.save(function(err, savedMeal) {
          if (err) {
            return res.status(500).json({message: "Database error"});
          } else {
            return res.status(200).json({message: "Record created. But we couldn't match any of your foods", meal: savedMeal});
          }
        });
        
      });

    }
  },

  updateOne: function(req, res) {

    console.log("=====update meal record=====");

    //check meal id
    if (!req.query.mealId) {
      return res.status(400).json({message: "Missing record ID"});
    }

    Meal.findById(req.query.mealId, function(err, meal) {

      if (meal == null || meal == undefined) {
        return res.status(400).json({message: "Record does not exist"});
      }

      //check permission if editing other user's record
      if (!meal.user.equals(req.decoded.userId) && req.decoded.permissions.indexOf("all-meals") == -1) {
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
      if (err) {
        return res.status(500).json({message: "Database error"});
      } else {
        return res.status(200).json({message: "Meal created", meal: updatedMeal});
      }
    });

    });

  },

  deleteOne: function(req, res) {

    console.log("=====delete meal=====");

    //check meal
    if (!req.query.mealId) {
      return res.status(400).json({message: "Missing record ID"});
    }

    console.log(req.query.mealId);

    Meal.findById(req.query.mealId, function(err, meal) {

      //check permission if editing other user's record
      if (!meal.user.equals(req.decoded.userId) && req.decoded.permissions.indexOf("all-meals") == -1) {
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
