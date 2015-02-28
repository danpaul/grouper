var postModel = {};

var baseModel = require('./base')

var TABLE_NAME = 'post';

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
* postData should include title, user, and url
*/
postModel.add = function(postData, callbackIn){
	postData.created = baseModel.getCurrentTimestamp();
    baseModel.add(TABLE_NAME, postData, callbackIn)
}

/**
* Updates post's vote
*/
postModel.updateVote = function(postId, vote, callbackIn){
	baseModel.updateVote(TABLE_NAME, postId, callbackIn, callbackIn)
}

module.exports = postModel