var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

var helpers = require('../inc/helpers.js')

/********************************************************************************
				CONSTANT DATA
********************************************************************************/

var flashCodes = {
	1: 'You must be logged in.',
	2: 'The user is invalid.'
}

/********************************************************************************
				FUNCTIONS
********************************************************************************/

var getFlashMessage = function(req){
	if( req.query.f !== undefined && flashCodes[req.query.f] !== undefined ){
		return flashCodes[req.query.f]
	}
	return null;
}

/********************************************************************************
				USER LOGIN
********************************************************************************/

router.get('/api/user/login', function(req, res) {
	res.render('login', { flash: getFlashMessage(req) });
});

router.post('/api/user/login', function(req, res) {

	var User = req.app.models.User;

	//ensure username or email is set
	if( typeof(req.body.username) !== 'string' && typeof(req.body.email) !== 'string' ){
		helpers.reportGenericError('Username or or email must be set.', res);
		return;
	}

	if( typeof(req.body.password) !== 'string' || req.body.password === '' ){
		helpers.reportGenericError('Password must be set.', res);
		return;
	}

	// determine if username or email is being used
	if( req.body.email == '' ){
		if( typeof(req.body.username) !== 'string' ){
			
		}
		var query = {where: {username: req.body.username}};

	} else {
		var query = {where: {email: req.body.email}};
	}

	// find user
	User.find(query)
		.success(function(user){

			// check if user exists
			if( user === null ){
				helpers.reportGenericError('Username or email is not correct or not registered.', res);
				return;
			}

			//check password
			bcrypt.compare(req.body.password, user.password, function(err, valid) {
				if(err){
					helpers.reportGenericError(error);
				} else {
					if( valid ){
						req.session.loggedIn = true;
						req.session.user = {};
						req.session.user.id = user.id;
						res.send(true);
						return;
					} else {
						res.send({'password':['The password is not valid.']});
						return;
					}
				}
			});
		})
		.error(function(error){
			helpers.reportGenericError(error);
		})
});

router.get('/api/user/logout', function(req, res) {
	req.session.loggedIn = false;
	req.session.destroy();
	res.render('login', {flashMessage: getFlashMessage(req) });
});

/********************************************************************************
				USER REGISTER
********************************************************************************/

router.get('/api/user/register', function(req, res) {
  res.render('register');
});

router.post('/api/user/register', function(req, res) {

	var User = req.app.models.User;

	// confirm email is unique
	User.find({where: {email: req.body.email}})
		.success(function(user){

			// send error if user with email already exists
			if( user !== null ){
				res.end({'email':["A user with this email already exists."]});
				return;
			}

			// confirm username is unique
			User.find({where: {username: req.body.username}})
				.success(function(user){

					if( user !== null ){
						res.end({'username':["This username has already been taken."]});
					}

					// confirm passwords match
					if( req.body.password !==  req.body.confirmpassword ){
						res.end({'password':["The passwords do not match."]});
					}

					// confirm passwords length
					if( !(req.body.password.length >= 8 && req.body.password.length <= 64) ){
						res.end({'password':["The passwords must be between 8 and 64 characters."]});
					}

					// construct user
					var user = User.build({
						email: req.body.email,
						username: req.body.username,
						password: req.body.password
					});

					// validate user
					var validationResult = user.validate();

					if( validationResult !== null ){
						res.end(validationResult);
					}

					// hash password
					bcrypt.hash(user.password, 8, function(err, hash){
						if(err){
							console.log(err);
						} else {
							user.password = hash;
							user.save()
								.success(function(user){
									res.send(true);
								})
								.error(function(error){
									helpers.reportGenericError(error);							
								});
						}
					});
				})
		})
		// .error(function(error){
		// 	helpers.reportGenericError(error);
		// })
		.error(helpers.reportGenericError);
});



module.exports = router;