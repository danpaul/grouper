(function(){


var userModel = {};

var async = require('async');
var baseModel = require('./base');
var groupModel = require('./group.js');
var knex = global.grouper_app.get('GROUPER_KNEX');
var voteModel = require('./vote');

userModel.add = function(userData, callbackIn){
	// TODO: validation
	baseModel.add('users', userData, callbackIn);
}

userModel.castVote = function(userId, postId, vote, callbackIn){

    userModel.userHasNotVoted(userId, postId, callbackIn, function(){
           knex('user_votes')
            .insert({
                'user': userId,
                'post': postId,
                'vote': vote
            })
            .then(function(userVoteId){
                voteModel.updateVote('posts', postId, vote, function(err){
                    if( err ){ callbackIn(err); }
                    else{
                        groupModel.updateUsersGroupVotes(userId, postId, vote, callbackIn);
                    }
                });
            })
            .catch(callbackIn)
    });
}

userModel.userHasNotVoted = function(userId, postId, alreadyVotedCallback, notVotedCallback){

    knex('user_votes')
        .select('user')
        .where({user: userId, post: postId})
        .then(function(rows){
            if( rows.length !== 0 ){ alreadyVotedCallback; }
            else{ notVotedCallback(); }
        })
        .catch(alreadyVotedCallback)
}

userModel.createSeedUsers = function(numberOfUsers, callbackIn){

    var users = [];
    var userIds = [];
    var currentTime = new Date().getTime()
    var i;

    for( i = 0; i < numberOfUsers; i++ ){
        users.push({
            email: 'email_' + i.toString() + '_' + currentTime + '@asdf.com',
            username: 'user_' + i.toString() + '_' + currentTime,
            password: '$2a$08$YgEm3NLhcn5JG36MDovQIuf6Js1jaa4BWGoYRYI5VmcCrMYzEArOi'
        });
    }

    async.eachSeries(users, function(user, callback){
    	userModel.add(user, function(err, userId){
    		if(err){ callback(err); }
    		else{
    			userIds.push(userId)
    			callback();
    		}
    	})
    }, function(err){
    	if(err){ callbackIn(err); }
    	else{ callbackIn(null, userIds); }
    })
}

// takes userId, passes array of groupIds as second argument to callbackIn
userModel.getGroups = function(userId, callbackIn){
    knex('groups_users')
        .where({user: userId})
        .select('group')
        .then(function(rows){
            callbackIn(null, rows.map(function(row){ return row.group }));
        })
        .catch(callbackIn)
}

userModel.getRecentVotes = function(userId, numberOfVotes, callbackIn){
    knex('user_votes')
        .where({user: userId})
        .select(['vote', 'post'])
        .orderBy('created', 'desc')
        .limit(numberOfVotes)
        .then(function(rows){ callbackIn(null, rows); })
        .catch(callbackIn)
}

module.exports = userModel;

}())