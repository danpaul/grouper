var userVote = {}

var config = require('../config')

var async = require('async')

var groupModel = require('./group')
var groupVoteModel = require('./group_vote')
var postModel = require('./post')
var voteModel = require('./vote')
var userModel = require('./user')
var userGroupAgreementModel = require('./user_group_agreement')

var knex = config.knex

var TABLE_NAME = 'user_vote'

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
* Returns a maximum of number of votes of users recent votes ordered in desc
*   order.
* Returned array contains post and vote (both ids).
*/
userVote.getRecentVotes = function(userId, numberOfVotes, callbackIn){
    knex(TABLE_NAME)
        .where({user: userId})
        .select(['vote', 'post'])
        .orderBy('created', 'desc')
        .limit(numberOfVotes)
        .then(function(rows){ callbackIn(null, rows); })
        .catch(callbackIn)
}

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
                async.waterfall([

                    // update general post vote
                    function(callback){
                        postModel.updateVote(postId, vote, callback)
                    },

                    // get groupId if it was not passed in
                    function(callback){
                        if( groupId === null ){
                            userModel.get(userId, function(err, user){
                                if( err ){ callbackIn(err) }
                                else {
                                    groupId = user.group
                                    callback()
                                }
                            })
                        } else {
                            callback()                            
                        }
                    },

                    // update group vote
                    function(callback){
                        groupVoteModel.update(groupId,
                                              postId,
                                              vote,
                                              callback);
                    },

                    // update user group agreement
                    function(callback){
                        userGroupAgreementModel.update(groupId,
                                                       userId,
                                                       postId,
                                                       vote,
                                                       callback);
                    }

                ], callbackIn)
            })
            .catch(callbackIn)
    });

}

/**
* Checks if user has vote for post.
* If user has voted or an error occurs, alreadyVotedCallback gets called.
* Otherwise, notVotedCallback gets called.
*/
userVote.hastNotVoted = function(userId,
                                 postId,
                                 alreadyVotedCallback,
                                 notVotedCallback){

    knex(TABLE_NAME)
        .select('user')
        .where({user: userId, post: postId})
        .then(function(rows){
            if( rows.length !== 0 ){ alreadyVotedCallback(); }
            else{ notVotedCallback(); }
        })
        .catch(alreadyVotedCallback)
}

module.exports = userVote;