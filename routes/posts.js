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
var PostGroupVote = models.PostGroupVote;
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


// updates vote for postVoteTotal
// vote is either 0 or 1
var updatePostVoteTotal = function(postId, vote, callback){

	// find post vote total
	PostVoteTotal.find({where: {post: postId}})
	.success(function(postVoteTotal){

		// confirm valid record is returned
		if(postVoteTotal === null){
			callback('Unable to retrieve post: ' + postId);
			return;
		}

		updateVote(postVoteTotal, vote, callback);

	})
	.error(function(err){ console.log(err);	})
}

// calculates percentage of upvotes (avoids divide by zero)
var calculatePercentageUp = function(upVotes, downVotes){
	if( downVotes <= 0.0 ){
		if( upVotes >= 0.0 ){ return 1.0;
		} else { return 0.0 }
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
		if(userGroup === null){
			callback('Unable to get UserGroup with user ID: ' + userId + ' and groupId: ' + groupId);
			return;
		}
		userGroup.destroy().success(function(){ callback(null); })
		.error(callback)
	})
	.error(callback)
}

// checks that record of type `modelType` with id exists
// if `modelType` is an array, `id` must also be an array and 
//	each will be verified
var verifyExistence = function(modelType, id, callback){

	var Model;
	switch(modelType){
		case 'group':
			Model = Group;
			break;
		case 'post':
			Model = Post;
			break;
		case 'user':
			Model = User;
			break;
		default:
			callback(modelType + ' is not a valid model.');
			return;
	}
	Model.find(id).success(function(instance){
		if( instance === null ){
			callback('Could not find instance of ' + modelType + ' with id: ' + id);
		} else {
			callback(null, instance);
		}
	})
}

// updates model insance vote total
// vote must be either 0 (upvote) or 1 (downvote)
// instance should follow convention and have these fields: up, down, total, percentageUp
var updateVote = function(instance, vote, callback){

	// validate vote
	if( !(vote === 0 || vote === 1) ){
		callback('The following is not a valid vote: ' + vote);
		return;
	}

	// set up or down vote field
	var incrementField = 'up';
	if( vote === 1 ){ var incrementField = 'down'; }

	// increment correct value and adjust percentageUp and total vote
	instance.increment( incrementField, {by: 1}).success(function(newInstance){ 
		newInstance.reload().success(function(reloadedInstance){
			reloadedInstance.percentageUp = calculatePercentageUp(reloadedInstance.up, reloadedInstance.down);
			reloadedInstance.total = reloadedInstance.up + reloadedInstance.down;
			reloadedInstance.save()
			.success(function(finalInstance){ callback(null, finalInstance)})
			.error(callback);
		})
		.error(callback)
	})
	.error(callback);

}

// registers group vote for a post (you should verify that user belongs to group)
// 	(you should also verify that user has not already voted for post)
// vote must be either 0 or 1 (0 for up, 1 for down)
var registerPostGroupVote = function(postId, groupId, vote, callback){

	// verify post and group exist
	verifyExistence('post', postId, function(err, post){
		if(err){ callback(err); return; }
		else{
			verifyExistence('group', groupId, function(err, group){
				if(err){ callback(err); return; }
				else{

					// find or create postGroupVote
					PostGroupVote.findOrCreate({
						group: groupId,
						post: postId
					},{
						up: 0,
						down: 0,
						total: 0,
						percentageUp: 0.0
					})
					// update vote
					.success(function(postGroupVote){
						updateVote(postGroupVote, vote, callback);
					})
					.error(callback)
				}
			})
		}
	});
}

// updates user group agreement table (table that shows how often given user
//		agrees with group)
// postGroupVote should be an instance
var updateUserGroupAgreement = function(userId, groupId, postGroupVote, userVote, callback){
	// verify user and group exist
	verifyExistence('user', userId, function(err, post){
		if(err){ callback(err); return; }
		else{
			verifyExistence('group', groupId, function(err, group){
				if(err){ callback(err); return; }
				else{
					// find or create UserGroupAgreement
					UserGroupAgreement.findOrCreate({
						group: groupId,
						user: userId
					},{
						agree: 0,
						disagree: 0,
						agreePercentage: 0.0
					})
					// update vote
					.success(function(userGroupAgreement){

						// if 1 or no votes have been made for post, or if votes are split, do nothing
						if( postGroupVote.total <= 1 || postGroupVote.percentageUp == 0.5 ){
							callback(null, userGroupAgreement);
							return;
						}

						var vote;
						// determine if user is in agreement
						if( (userVote === UPVOTE && postGroupVote.percentageUp > 0.5) ||
							(userVote === DOWNVOTE && postGroupVote.percentageUp < 0.5) )
						{
							// user agrees, gets an upvote
							vote = UPVOTE;
						} else {
							// user disagrees, gets a downvote
							vote = DOWNVOTE;
						}

						updateVote(userGroupAgreement, vote, callback);

					})
					.error(callback)
				}
			})
		}
	})
}

/********************************************************************************
				TESTING SHIZ
********************************************************************************/

var seed = function(callback){

	var userId = 1;
	var numberOfGroups = 10;
	var callsMade = 0;

	// create groups
	for(i = 0; i < numberOfGroups; i++ ){
		
		Group.create()
			.success(function(){
				if(callsMade === numberOfGroups - 1){

					callback(null, true);
				}else{
					callsMade++;
				}
			})
			.error(function(){
				callback('Unable to create group', null);
			});
		
	}

	

}

var test = function(){

}

test();

/********************************************************************************
				GROUPS
********************************************************************************/

// var logError = function(err, res){ if( err ){ console.log(err); } }
router.get('/api/test/', function(req, res) {

	seed(function(err, response){
		if( err ){
			console.log(err);
			res.send(err);
		}else{
			res.send('success');
		}		
	});

	// res.send('foo');

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
						updatePostVoteTotal(post.id, mappedVote, helpers.logError);

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