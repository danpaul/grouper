var constants = require('./constants');

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

// check login and redirec on error
exports.checkLogin = function(req, res){
	if( req.session.loggedIn !== true ){
		res.redirect(302, '/api/user/login?f=1');
		return;
	}
}

/**
* @param - takes int userVote, float percentage of upvotes, int total votes cast
* @return - null if 1 or less votes have been cast, `UPVOTE` if user agrees, `DOWNVOTE` if
*   user disagrees
*/
exports.getUserAgreementVote = function(
                                    userVote,
                                    percentageGroupUpVotes,
                                    totalVotes){
    // if 1 or no votes have been made for post, or if votes are split, do nothing
    if( totalVotes <= 1 || percentageGroupUpVotes == 0.5 ){
        return null;
    } else {
        // determine if user is in agreement
        if( (userVote === constants.upvote && percentageGroupUpVotes > 0.5) ||
            (userVote === constants.downvote && percentageGroupUpVotes < 0.5) )
        {
            // user agrees, gets an upvote
            return constants.upvote;
        } else {
            // user disagrees, gets a downvote
            return constants.downvote;
        }
    }
}

// log error
exports.logError = function(err, res){ if( err ){ console.log(err); } }