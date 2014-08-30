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




module.exports = router;