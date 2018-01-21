var File = require("../models/fileModel");
var User = require("../models/userModel");
var multer = require("multer");
var fs = require("fs");
var axios = require("axios");


module.exports = function(req, res) {

	console.log("=====test file upload=====");
	
	//validate file extention
	if (!req.file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
		return res.status(400).json({message: "Illegal file extention. Only jpg, jpeg, png, gif are allowed."});
	}


	//find user
	User.findById(req.query.userId, function(err, user) {
		if (err) {
			console.log(err);
			return res.send(err);
		} else {
			//store into mongodb user object
			user.profilePic.data = fs.readFileSync(req.file.path);
			user.profilePic.contentType = "image/png";
			user.save(function(err, savedUser) {
				if (err) {
					console.log(err);
					return res.send(err);
				} else {
					return res.json({message: "Profile picture uploaded", user: savedUser});
				}
			})
		}
	});

};


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
