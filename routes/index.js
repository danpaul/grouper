var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

/********************************************************************************
				HELPER FUNCTIONS AND DATA
********************************************************************************/

var checkLogin = function(req, res){
	if( req.session.loggedIn !== true ){
		res.redirect(302, '/api/user/login?f=1');
		return;
	}
}

var reportGenericError = function(error){
	console.log(error);
	res.send({'error':['An error occured. Please try again.']});
}

var getFlashMessage = function(req){
	if( req.query.f !== undefined && flashCodes[req.query.f] !== undefined ){
		return flashCodes[req.query.f]
	}
	return null;
}

var flashCodes = {
	1: 'You must be logged in.',
	2: 'The user is invalid.'
}

// router.get('/', function(req, res) {
//   res.render('index', { title: 'Express' });
// });

/********************************************************************************
				USER MANAGEMENT
********************************************************************************/

router.get('/api/user/login', function(req, res) {
	res.render('login', { flash: getFlashMessage(req) });
});

router.post('/api/user/login', function(req, res) {

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
						req.session.user = {};
						req.session.user.id = user.id;
						res.send(true);
					} else {
						res.send({'password':['The password is not valid.']});
						return;
					}
				}
			});
		})
		.error(function(error){
			reportGenericError(error);
		})
});

router.get('/api/user/logout', function(req, res) {
	req.session.loggedIn = false;
	req.session.destroy();
	res.render('login', {flashMessage: getFlashMessage(req) });
});


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
				res.send({'email':["A user with this email already exists."]});
				return;
			}

			// confirm username is unique
			User.find({where: {username: req.body.username}})
				.success(function(user){

					if( user !== null ){
						res.send({'username':["This username has already been taken."]});
						return;
					}

					// confirm passwords match
					if( req.body.password !==  req.body.confirmpassword ){
						res.send({'password':["The passwords do not match."]});
						return;
					}

					// confirm passwords length
					if( !(req.body.password.length >= 8 && req.body.password.length <= 64) ){
						res.send({'password':["The passwords must be between 8 and 64 characters."]});
						return;
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
						return;
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
									return;
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

/********************************************************************************
				POST
********************************************************************************/

router.get('/api/post/new', function(req, res) {
	checkLogin(req, res);
	res.render('newpost');
});

router.post('/api/post/new', function(req, res){

	checkLogin(req, res);

console.log(req.body.url);

	// construct post
	var post = req.app.models.Post.build({
		url: req.body.url,
		title: req.body.title,
		user: req.session.user.id
	});

	// validate post
	var validationResult = post.validate();

	if( validationResult !== null ){
		res.send(validationResult);
		return;
	}

	post.save()
		.success(function(post){
			res.send(true);
			return;
		})
		.error(reportGenericError)
});

module.exports = router;