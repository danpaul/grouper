// var app = require('../app');

var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* GET new form. */
router.get('/api/register', function(req, res) {
  // console.log(req.app);
  res.render('register');
});

/* GET new form. */
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
									console.log(error);
							  		res.send({'error':['a An error occured. Please try again.']});
							  	});
						}
					});
				})
		})
		.error(function(error){
			console.log(error);
			res.send({'error':['b An error occured. Please try again.']});
		})

});

/* GET new form. */
router.get('/api/new-post', function(req, res) {
  res.render('newpost');
});

router.post('/api/new-post', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;