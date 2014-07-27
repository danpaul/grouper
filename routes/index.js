var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

var reportGenericError = function(error){
	console.log(error);
	res.send({'error':['An error occured. Please try again.']});
}

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


router.get('/api/login', function(req, res) {
console.log(req.session);
	res.render('login');
});

router.post('/api/login', function(req, res) {

	var User = req.app.models.User;

	// determine if username or email is being used
	if( req.body.email == '' ){
		var query = {where: {username: req.body.username}};
	} else {
		var query = {where: {email: req.body.email}};
	}

	// find user
	User.find(query)
		.success(function(user){
			//check password
			bcrypt.compare(req.body.password, user.password, function(err, valid) {
				if(err){
					reportGenericError(error);
				} else {
					if( valid ){
						req.session.loggedIn = true;
						res.send(true);
					} else {
						res.send({'password':['The password is not valid.']});
					}
				}
			});
		})
		.error(function(error){
			reportGenericError(error);
		})
});

router.get('/api/logout', function(req, res) {
	req.session.loggedIn = false;
	res.render('login');
});

router.get('/api/register', function(req, res) {
  res.render('register');
});

router.post('/api/register', function(req, res) {

	var User = req.app.models.User;

	// confirm email is unique
	User.find({where: {email: req.body.email}})
		.success(function(user){

			// send error if user with email already exists
			if( user !== null ){
				res.send({'email':["A user with this email already exists."]});
			}

			// confirm username is unique
			User.find({where: {username: req.body.username}})
				.success(function(user){

					if( user !== null ){
						res.send({'username':["This username has already been taken."]});
					}

					// confirm passwords match
					if( req.body.password !==  req.body.confirmpassword ){
						res.send({'password':["The passwords do not match."]});
					}

					// confirm passwords length
					if( !(req.body.password.length >= 8 && req.body.password.length <= 64) ){
						res.send({'password':["The passwords must be between 8 and 64 characters."]});
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
						res.send(validationResult);
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
							  		console.log(user);
								})
								.error(function(error){
									reportGenericError(error);							
								});
						}
					});
				})
		})
		.error(function(error){
			reportGenericError(error);
		})

});

router.get('/api/new-post', function(req, res) {
  res.render('newpost');
});

router.post('/api/new-post', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;