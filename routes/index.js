var p = function(s){
	console.log(JSON.stringify(s));
}


var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

var UPVOTE = 0;
var DOWNVOTE = 1;

/********************************************************************************
				CONSTANT DATA
********************************************************************************/

var flashCodes = {
	1: 'You must be logged in.',
	2: 'The user is invalid.'
}

var voteMap =  {
	'down': 0,
	'up': 1
}

/********************************************************************************
				HELPER FUNCTIONS
********************************************************************************/

var checkLogin = function(req, res){
	if( req.session.loggedIn !== true ){
		res.redirect(302, '/api/user/login?f=1');
		return;
	}
}

var reportGenericError = function(error, response){
	console.log(error);

	if(typeof(res) === 'undefined'){ var r = response; }
	// r.end({'error':['An error occured. Please try again.']});
	r.send({'error':[error]});
}

var reportHiddenError = function(error, response){
	console.log(error);
	r.send({'error':['An error occured. Please try again.']});
}

var getFlashMessage = function(req){
	if( req.query.f !== undefined && flashCodes[req.query.f] !== undefined ){
		return flashCodes[req.query.f]
	}
	return null;
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
						return;
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
									reportGenericError(error);							
								});
						}
					});
				})
		})
		// .error(function(error){
		// 	reportGenericError(error);
		// })
		.error(reportGenericError);
});

/********************************************************************************
				POSTS
********************************************************************************/


router.get('/api/post/new', function(req, res) {
	checkLogin(req, res);
	res.render('newpost');
});

router.post('/api/post/new', function(req, res){

	checkLogin(req, res);

	// construct post
	var post = req.app.models.Post.build({
		url: req.body.url,
		title: req.body.title,
		user: req.session.user.id
	});

	// validate post
	var validationResult = post.validate();

	if( validationResult !== null ){
		res.end(validationResult);
	}

	post.save()
		.success(function(post){
			// create row for totals
			// postVoteTotal = req.app.models.PostVoteTotal.create(function(postVoteTotal){
			// 	post: post.id,
			// 	up: 0,
			// 	down: 0,
			// 	total: 0,
			// 	percentageUp: 0.0
			// });

			res.send(true);
			return;
		})
		.error(reportGenericError)
});

router.get('/api/posts/all', function(req, res) {

	req.app.models.Post.findAll()
		.success(function(posts){
			res.render('allposts', { posts: posts });
		})
		.error(reportGenericError);
});


router.post('/api/post/vote', function(req, res) {

	// checkLogin(req, res);

	var Post = req.app.models.Post;
	var UserVote = req.app.models.UserVote;
	var postId = req.body.id;
	var vote = req.body.vote;
	// var userId = req.session.user.id;

userId = 1;

	// confirm postId is set
	if( typeof(postId) === 'undefined' ){
		reportGenericError('Invalid user or post ID', res);
		return;
	}

	// confirm a valid vote is present
	if( !(vote === 'up' || vote === 'down') ){
		reportGenericError('Invalid vote.', res);
		return;
	}

	// confirm post exists
	Post.find(postId)
		.success(function(post){
			if( post === null ){
				reportGenericError('Post ID not found.', res);
				return;
			}

			// confirm user has not yet vote for post
			UserVote.find(post.id)
			.success(function(userVote){
				if( userVote !== null ){
					reportGenericError('You  have already voted for this post.', res);
					return;
				}

				// save user vote
				UserVote.create({
					vote: voteMap[vote],
					user: userId,
					post: postId
				})
				.success(function(vote){
					// update total votes

					// find or create vote total
					req.app.Models.PostVoteTotal.find({where: {post: post.id}})
					.success(function(postVoteTotal)){
						// if post doesn't exist, create it
						if(postVoteTotal === null){
							req.app.Models.PostVoteTotal.create({
								
							})


						}else{
							postVoteTotal
						}

					}
					.error(function(e){ reportHiddenError(e, res); })
					//update group votes


					res.send(true);
					return;
				})
				.error(function(){
					reportGenericError('Unable to save record.', res)
				})

			})
			.error(function(){
				reportGenericError('Unable to retrieve record.', res)
			})

		})
		.error(function(e){
			reportGenericError(e, res);
			return;
		})

});

module.exports = router;