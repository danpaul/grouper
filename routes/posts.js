var express = require('express');
var router = express.Router();

var models = require('../models.js').models();

var helpers = require('../inc/helpers.js');

/********************************************************************************
				CONSTANTS / DATA
********************************************************************************/

var UPVOTE = 0;
var DOWNVOTE = 1;
var VOTE_MAP = {
	up: 0,
	down: 1
};

var Group = models.Group;
var Post = models.Post;
var PostVoteTotal = models.PostVoteTotal;
var User = models.User;
var UserGroup = models.UserGroup;
var UserVote = models.UserVote;


/********************************************************************************
			FUNCTIONS
********************************************************************************/


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


var updatePostVoteTotal = function(postId, mappedVote){

	// find post vote total
	PostVoteTotal.find({where: {post: postId}})
	.success(function(postVoteTotal){

		// confirm valid record is returned
		if(postVoteTotal === null){
			console.log('Unable to retrieve post: ' + postId);
			return;
		}

		// increment correct value and adjust percentageUp and total vote
		var incrementField = 'up';
		if( mappedVote === DOWNVOTE ){ var incrementField = 'down'; }

		postVoteTotal.increment( incrementField, {by: 1}).success(function(pvt){ 
			pvt.reload().success(function(pvt){
				pvt.percentageUp = calculatePercentageUp(pvt.up, pvt.down);
				pvt.total = pvt.up + pvt.down;
				pvt.save().error(function(err){ console.log(err); });
			})
			.error(function(err){ console.log(err);	})
		})
		.error(function(err){ console.log(err);	});
	})
	.error(function(err){ console.log(err);	})
}


var calculatePercentageUp = function(upVotes, downVotes){

	if( downVotes <= 0.0 ){
		if( upVotes >= 0.0 ){
			return 1.0;
		} else {
			return 0.0
		}
	} 
	if( upVotes <= 0.0 ){ return 0.0; }
	return(upVotes / (upVotes + downVotes));
}

var addUserToGroup = function(userId, groupId, callback){
	// confirm user exists
	User.find(userId).success(function(user){
		if( user === null ){
			callback('Error: this user not found by user ID: ' + userId);
			return;
		}
		// confirm group exists
		Group.find(groupId).success(function(group){
			if( group === null ){
				callback('Error: user with followin ID does not exist: ' + groupId);
			}
			// add user to group
			UserGroup.findOrCreate({user: userId, group: groupId})
			.success(function(userGroup){ callback(null, userGroup) })
			.error(callback)
		})
		.error(callback)
	})
	.error(callback)
}


var removeUserFromGroup = function(userId, groupId, callback){

	UserGroup.find({ where: { user: userId, group: groupId }})
	.success(function(userGroup){

// console.log(userGroup);
// res.send(userGroup);
		if(userGroup === null){
			callback('Unable to get UserGroup with user ID: ' + userId + ' and groupId: ' + groupId);
			return;
		}
		// userGroup.destroy().success(callback(null))
// userGroup.destroy().success(function(){console.log('destroy')})
userGroup.destroy().success(function(){ callback(null); })
		.error(callback)
	})
	.error(callback)
}

//////test
router.get('/test', function(req, res) {
	res.send('foo');
	setTimeout(function(){ console.log('bar'); }, 3000);
});


/********************************************************************************
				GROUPS
********************************************************************************/

var logError = function(err, res){ if( err ){ console.log(err); } }

router.get('/api/test/add-group', function(req, res) {

	// Group.create({}).success(function(){
	// 	res.send('success');
	// });

	// addUserToGroup(1, 2, logError);
	// addUserToGroup(1, 3, logError);
	// addUserToGroup(1, 4, logError);
	// addUserToGroup(1, 5, logError);

// res.send('foo');

removeUserFromGroup(1, 3, logError);
// 	if( err ){ 
// 		console.log(err);
// 	} else {
// 		res.send('success');
// 	}
// })

res.send('foo');

});

/********************************************************************************
				POSTS
********************************************************************************/


// new post get request
router.get('/api/post/new', function(req, res) {
	helpers.checkLogin(req, res);
	res.render('newpost');
});

// add new post (post request)
router.post('/api/post/new', function(req, res){

	helpers.checkLogin(req, res);

	// construct post
	var post = Post.build({
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
			createPostVoteTotal(
				PostVoteTotal,
				post.id,				
				function(err){
					if( err ){
						helpers.reportGenericError(err);
						return;
					} else {
						res.send(true);
						return;
					}
			});
		})
		.error(helpers.reportGenericError)
});

// display all posts
router.get('/api/posts/all', function(req, res) {

	Post.findAll()
		.success(function(posts){
			res.render('allposts', { posts: posts });
		})
		.error(helpers.reportGenericError);
});



/********************************************************************************
				VOTES
********************************************************************************/

router.post('/api/post/vote', function(req, res) {

	// helpers.checkLogin(req, res);

	var postId = req.body.id;
	var vote = req.body.vote;
	// var userId = req.session.user.id;



userId = 1;



	// confirm postId is set
	if( typeof(postId) === 'undefined' ){
		helpers.reportGenericError('Invalid user or post ID', res);
		return;
	}

	// confirm a valid vote is present
	if( !(vote === 'up' || vote === 'down') ){
		helpers.reportGenericError('Invalid vote.', res);
		return;
	}

	// set mapped vote value
	var mappedVote = VOTE_MAP[vote];

	// confirm post exists
	Post.find(postId)
		.success(function(post){
			if( post === null ){
				helpers.reportGenericError('Post ID not found.', res);
				return;
			}

			// confirm user has not yet voted for post
			UserVote.find(post.id)
			.success(function(userVote){

				// if uservote already exists, return error
				if( userVote !== null ){
					helpers.reportGenericError('You  have already voted for this post.', res);
					return;
				}

				// if uservote doesn't exist, create it
				UserVote.create({
					vote: mappedVote,
					user: userId,
					post: postId
				})
				.success(function(voteObject){

					// send response and continue processing
					res.send(true);

					// find vote total
					PostVoteTotal.find({where: {post: post.id}})
					.success(function(postVoteTotal){

						// update post vote total( postVoteTotal is created automatically when
						//		a new post is created)
						updatePostVoteTotal(post.id, mappedVote);

					})
					.error(function(e){ helpers.reportHiddenError(e, res); })
					//update group votes

					
					return;
				})
				.error(function(){
					helpers.reportGenericError('Unable to save record.', res)
					return;
				})

			})
			.error(function(){
				helpers.reportGenericError('Unable to retrieve record.', res);
				return;
			})

		})
		.error(function(e){
			helpers.reportGenericError(e, res);
			return;
		})

});

module.exports = router;