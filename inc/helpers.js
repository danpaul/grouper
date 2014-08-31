
// console logs the message and sends it to the user.
exports.reportGenericError = function(error, response){
	console.log(error);
	response.send({'error':[error]});
}

// consloe logs the error and reports a generic message to user
exports.reportHiddenError = function(error, response){
	console.log(error);
	r.send({'error':['An error occured. Please try again.']});
}

exports.checkLogin = function(req, res){
	if( req.session.loggedIn !== true ){
		res.redirect(302, '/api/user/login?f=1');
		return;
	}
}