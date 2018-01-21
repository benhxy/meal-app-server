//to compress the user's multiple account names and emails

var compressUser = function(user) {
	let compressedUser = {
		role: user.role,
		expectedKcal: user.expectedKcal,
		_id: user._id,
		verified: user.local.verified,
		loginFailCount: user.local.loginFailCount,

	}

	if (user.facebook != undefined && user.facebook.id != "") {
		compressedUser.email = user.facebook.email;
		compressedUser.name = user.facebook.name;
	} else if (user.google != undefined && user.google.id != "") {
		compressedUser.email = user.google.email;
		compressedUser.name = user.google.name;
	} else {
		compressedUser.email = user.local.email;
		compressedUser.name = user.local.name;
	}

	return compressedUser;
}

module.exports = compressUser;