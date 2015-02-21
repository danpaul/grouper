var userVote = {}

var config = require('../config')
var groupModel = require('./group')
var groupVoteModel = require('./group_vote')
var postModel = require('./post')
var voteModel = require('./vote')
var userModel = require('./user')

var knex = config.knex

var TABLE_NAME = 'user_vote'

/**
* Checks if user has voted then casts user vote.
* groupId can be set to null in which case, it will be looked up
*/
userVote.vote = function(userId, groupId, postId, vote, callbackIn){
    userVote.hastNotVoted(userId, postId, callbackIn, function(){
           knex(TABLE_NAME)
            .insert({
                'user': userId,
                'post': postId,
                'vote': vote
            })
            .then(function(userVoteId){
                // update general post vote
            	postModel.updateVote(postId, vote, function(err){
                    if( err ){ callbackIn(err); }
                    else{
                        // update group vote
                        if( groupId === null ){
                            userModel.get(userId, function(err, user){
                                if( err ){ callbackIn(err) }
                                else {
                                    if( user === null ){ callbackIn() }
                                    else {
                                        groupVoteModel.update(user.group, postId, vote, callbackIn);
                                    }
                                }
                            })
                        } else {
                            groupVoteModel.update(user.group, postId, vote, callbackIn);
                        }
                    }
                });
            })
            .catch(callbackIn)
    });
}

/**
* Checks if user has vote for post.
* If user has voted or an error occurs, alreadyVotedCallback gets called.
* Otherwise, notVotedCallback gets called.
*/
userVote.hastNotVoted = function(userId, postId, alreadyVotedCallback, notVotedCallback){
    knex(TABLE_NAME)
        .select('user')
        .where({user: userId, post: postId})
        .then(function(rows){
            if( rows.length !== 0 ){ alreadyVotedCallback; }
            else{ notVotedCallback(); }
        })
        .catch(alreadyVotedCallback)
}

module.exports = userVote;