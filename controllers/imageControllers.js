var fs = require("fs");
var ObjectId = require("mongoose").Types.ObjectId;
var User = require("../models/userModel");
var Image = require("../models/imageModel");

var imageControllers = {

	readOne: function(req, res) {

		console.log("=====get image=====")

		if (req.query.imageId == undefined || req.query.imageId == "") {
			return res.status(400).json({message: "Invalid image ID"});
		}

		Image.findById(req.query.imageId, function(err, image) {
			if (err) {
				return res.status(400).json({message: "Invalid image ID"});
			} else {
				res.contentType("image/png");
				return res.send(image.img.data);
			}
		});
	},
	
	createOne: function(req, res) {

		console.log("=====upload image=====");

		//check user ID exists
		if (!req.query.userId || req.query.userId == "") {
			return res.status(400).json({message: "Missing user ID"});
		}
		
		//validate file extention
		if (!req.file.originalname.match(/\.(jpg|jpeg)$/)) {
			return res.status(400).json({message: "Illegal file extention. Only jpg, jpeg are allowed."});
		}

		//find user
		User.findById(req.query.userId, function(err, user) {
			if (err) {
				console.log(err);
				return res.status(400).json({message: "Invalid user ID"});
			} else {
				//store into mongodb image object
				let imageObj = new Image();
				imageObj.img.data = fs.readFileSync(req.file.path);
				imageObj.img.contentType = "image/jpeg";
				imageObj.save(function(err, savedImage) {
					if (err) {
						console.log(err);
						return res.status(500).json({message: "Database error"});
					} else {
						//update user image id
						user.profilePic = savedImage._id;
						console.log(user);
						user.save(function(err, updatedUser) {
							if (err) {
								console.log(err);
								return res.status(500).json({message: "Database error"});
							} else {
								return res.json({
									message: "Profile picture uploaded", 
									image: updatedUser.profilePic
								});
							}
						});
					}
				});
			}
		});
	}
}

module.exports = imageControllers;
/*

//if image is from social network
	let imageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/20375798_10214516407690459_8034972843412872942_n.jpg?oh=a9301e2f20f72aea229ca4e1ae2006b6&oe=5AD9CF35"
	axios.get(imageUrl)
	  .then(response => {
	  	
	  	//save the file into upload folder with multer
//console.log(response.data)

	  })
	  .catch(err => {

	  });

*/
