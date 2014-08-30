var express = require('express');
var router = express.Router();


var UPVOTE = 0;
var DOWNVOTE = 1;




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



// creates a new record for a post and calls callback of form
//		callback(error) on completions
var createPostVoteTotal = function(postVoteTotal, postId, callback){

	// create row for totals
	postVoteTotal = postVoteTotal.create({
		post: postId,
		up: 0,
		down: 0,
		total: 0,
		percentageUp: 0.0
	})

	// if success, callback without error
	.success(function(){
		callback(false);
	})

// if error, callback with error
	.error(function(error) {
		callback(error);
	})
}

router.get('/', function(req, res) {
  // res.render('index', { title: 'Express' });
  res.send('home');
});











/********************************************************************************
				POSTS
********************************************************************************/


// new post get request
router.get('/api/post/new', function(req, res) {
	checkLogin(req, res);
	res.render('newpost');
});

// add new post (post request)
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

// var createPostVoteTotal = function(postVoteTotal, postId, callback){

			createPostVoteTotal(
				req.app.models.PostVoteTotal,
				post.id,				
				function(err){
					if( err ){
						reportGenericError(err);
						return;
					} else {
						res.send(true);
						return;
					}
			});
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


/********************************************************************************
				VOTES
********************************************************************************/


// display all posts
router.post('/api/post/vote', function(req, res) {

	// checkLogin(req, res);

res.send('foo');
return;

	var Post = req.app.models.Post;
	var UserVote = req.app.models.UserVote;

	var postId = req.body.id;
	var vote = req.body.vote;
	var userId = req.session.user.id;

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

			// confirm user has not yet voted for post
			UserVote.find(post.id)
			.success(function(userVote){
				if( userVote !== null ){
					reportGenericError('You  have already voted for this post.', res);
					return;
				}

				// if uservote doesn't exist, create it
				UserVote.create({
					vote: voteMap[vote],
					user: userId,
					post: postId
				})
				.success(function(vote){
					// update total votes




					// find or create vote total
					req.app.Models.PostVoteTotal.find({where: {post: post.id}})
					.success(function(postVoteTotal){

						// if post vote doesn't exist, create it
						if(postVoteTotal === null){
							req.app.Models.PostVoteTotal.create({

							})
						}else{
							postVoteTotal
						}

					})
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