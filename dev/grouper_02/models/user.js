var userModel = {};

var config = require('../config')
var baseModel = require('./base')
var knex = config.knex

var _ = require('underscore')

var userGroupAgreementModel = require('./user_group_agreement')

var TABLE_NAME = 'user'

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
* Creates a new user. User Data should include username, email, password
* Username and email are optional.
*/
userModel.add = function(userData, callbackIn){
    baseModel.add(TABLE_NAME, userData, callbackIn);
}

/**
* Finds user by id, passes back user object if found else null.
*/
userModel.get = function(userId, callbackIn){
	knex(TABLE_NAME)
		.where('id', userId)
		.select(['id', 'email', 'username', 'group'])
		.then(function(rows){
			if( rows.length === 0 ){
				callbackIn(null, null)
			} else {
				callbackIn(null, rows[0])
			}
		})
		.catch(callbackIn)
}

/**
* Add user to group.
*/
userModel.addGroup = function(userId, groupId, callbackIn){
    knex(TABLE_NAME)
    	.where('id', userId)
        .insert({ user: userId, group: groupId })
        .update({group: groupId})
        .then(function(rows){ callbackIn(null); })
        .catch(callbackIn)
}

/**
* Passes back a number of users in group.
*/
userModel.countInGroup = function(groupId, callbackIn){
	knex(TABLE_NAME)
        .count('*')
        .where('group', groupId)
        .then(function(count){
            var numberOfUsersInGroup = count[0]['count(*)'];
            callbackIn(null, numberOfUsersInGroup);
        })
        .catch(callbackIn)
}

userModel.leaveGroup = function(groupId, userId, callbackIn){

    userGroupAgreementModel.removeUser(groupId, userId, function(err){
        if(err){ callbackIn(err) }
        else {
            knex(TABLE_NAME)
                .where('id', userId)
                .update('group', 0)
                .then(function(){ callbackIn() })
                .catch(callbackIn)
        }
    })

}

userModel.changeGroup = function(oldGroupId, newGroupId, userId, callbackIn){

    userGroupAgreementModel.removeUser(oldGroupId, userId, function(err){
        if(err){ callbackIn(err) }
        else {
            knex(TABLE_NAME)
                .where('id', userId)
                .update('group', newGroupId)
                .then(function(){ callbackIn() })
                .catch(callbackIn)
        }
    })
}

/**
* Passes back an array of userIds that are in group
*/
userModel.getUsersInGroup = function(groupId, callbackIn){
    knex(TABLE_NAME)
        .where('group', groupId)
        .select(['id'])
        .then(function(rows){
            callbackIn(null, _.map(rows, function(r){ return r.id; }))
        })
        .catch(callbackIn)
}

/**
* Takes and array of group ids
* If `returnMap` is `true`, an object with group id as key and array of user
*   ids as the value is passed back. Else an array of user ids is passed back.
*/
userModel.getUsersInGroups = function(groupIds, returnMap, callbackIn){
    knex(TABLE_NAME)
        .select(['id', 'group'])
        .whereIn('group', groupIds)
        .then(function(userGroups){
            if( returnMap ){
                var groupUserMap = {};
                _.each(userGroups, function(userGroup){
                    if( typeof(groupUserMap[userGroup.group]) === 'undefined' ){
                        groupUserMap[userGroup.group] = [];
                    }
                    groupUserMap[userGroup.group].push(userGroup.id)
                })
                callbackIn(null, groupUserMap)
            }else{
                userIds = _.uniq(_.flatten(_.map(userGroups, function(userGroup){
                    return userGroup.id;
                })));
                callbackIn(null, userIds);
            }
        })
        .catch(callbackIn)
}

/*******************************************************************************

                            OLD

*******************************************************************************/

// var async = require('async');
// var baseModel = require('./base');
// var groupModel = require('./group.js');
// var knex = global.grouper_app.get('GROUPER_KNEX');
// var voteModel = require('./vote');

// userModel.add = function(userData, callbackIn){
// 	// TODO: validation
// 	baseModel.add('users', userData, callbackIn);
// }

// userModel.castVote = function(userId, postId, vote, callbackIn){

//     userModel.userHasNotVoted(userId, postId, callbackIn, function(){
//            knex('user_votes')
//             .insert({
//                 'user': userId,
//                 'post': postId,
//                 'vote': vote
//             })
//             .then(function(userVoteId){
//                 voteModel.updateVote('posts', postId, vote, function(err){
//                     if( err ){ callbackIn(err); }
//                     else{
//                         groupModel.updateUsersGroupVotes(userId, postId, vote, callbackIn);
//                     }
//                 });
//             })
//             .catch(callbackIn)
//     });
// }

// userModel.userHasNotVoted = function(userId, postId, alreadyVotedCallback, notVotedCallback){

//     knex('user_votes')
//         .select('user')
//         .where({user: userId, post: postId})
//         .then(function(rows){
//             if( rows.length !== 0 ){ alreadyVotedCallback; }
//             else{ notVotedCallback(); }
//         })
//         .catch(alreadyVotedCallback)
// }

// userModel.createSeedUsers = function(numberOfUsers, callbackIn){

//     var users = [];
//     var userIds = [];
//     var currentTime = new Date().getTime()
//     var i;

//     for( i = 0; i < numberOfUsers; i++ ){
//         users.push({
//             email: 'email_' + i.toString() + '_' + currentTime + '@asdf.com',
//             username: 'user_' + i.toString() + '_' + currentTime,
//             password: '$2a$08$YgEm3NLhcn5JG36MDovQIuf6Js1jaa4BWGoYRYI5VmcCrMYzEArOi'
//         });
//     }

//     async.eachSeries(users, function(user, callback){
//     	userModel.add(user, function(err, userId){
//     		if(err){ callback(err); }
//     		else{
//     			userIds.push(userId)
//     			callback();
//     		}
//     	})
//     }, function(err){
//     	if(err){ callbackIn(err); }
//     	else{ callbackIn(null, userIds); }
//     })
// }

// // takes userId, passes array of groupIds as second argument to callbackIn
// userModel.getGroups = function(userId, callbackIn){
//     knex('groups_users')
//         .where({user: userId})
//         .select('group')
//         .then(function(rows){
//             callbackIn(null, rows.map(function(row){ return row.group }));
//         })
//         .catch(callbackIn)
// }

// userModel.getRecentVotes = function(userId, numberOfVotes, callbackIn){
//     knex('user_votes')
//         .where({user: userId})
//         .select(['vote', 'post'])
//         .orderBy('created', 'desc')
//         .limit(numberOfVotes)
//         .then(function(rows){ callbackIn(null, rows); })
//         .catch(callbackIn)
// }

module.exports = userModel;