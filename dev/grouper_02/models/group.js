var groupModel = {};

var config = require('../config')
var async = require('async')
var knex = config.knex
var _ = require('underscore')

var baseModel = require('./base')

var TABLE_NAME = 'group';

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
* Creates new group, passes group ID to callback
*/
groupModel.add = function(groupData, callbackIn){
    baseModel.add(TABLE_NAME, {}, callbackIn);
}

/**
* passes back an array of all groupIds
*/
groupModel.getAll = function(callbackIn){
    knex(TABLE_NAME)
        .select(['id'])
        .then(function(rows){
            var groupIds = _.map(rows, function(row){ return row.id; })
            callbackIn(null, groupIds);
        })
        .catch(callbackIn)
}

/**
* Passes back a random number number of groups
*/
groupModel.getRandom = function(numberOfGroups, callbackIn){
	knex(TABLE_NAME)
		.select(['id'])
		.orderByRaw('RAND()')
		.limit(numberOfGroups)
		.then(function(rows){
			callbackIn(null, _.map(rows, function(r){ return r.id; }))
		})
		.catch(callbackIn)
}

module.exports = groupModel;

/*******************************************************************************

                            OLD

*******************************************************************************/


// var _ = require('underscore');
// // var async = require('async');
// // var baseModel = require('./base');
// // var constants = require('../constants');

// // var voteModel = require('./vote');



// groupModel.assignUserToGroup = function(userId, groupId, callbackIn){

//     knex('groups_users')
//         .insert({ user: userId, group: groupId })
//         .then(function(rows){ callbackIn(null, rows[0]); })
//         .catch(callbackIn)
//         // if( err.code === 'ER_DUP_ENTRY' ){ callback(); }
// }


// groupModel.assignUsersToGroups = function(groupIds, userIds, numberOfGroupsUserBelongsTo, callbackIn){
//     var count;
//     var currentGroup = 0;

//     async.eachSeries(userIds, function(userId, callback){
//         count = 0;
//         async.whilst(
//             function(){ return count < numberOfGroupsUserBelongsTo },
//             function(callbackB){
//                 groupModel.assignUserToGroup(userId, groupIds[currentGroup], function(err){
//                     if(err){ callbackB(err); }
//                     else{
//                         count++;
//                         currentGroup++;
//                         if( currentGroup === groupIds.length ){ currentGroup = 0; }
//                         callbackB();
//                     }
//                 });
//             },
//             callback
//         )
//     }, callbackIn)
// }

// // groupModel.createSeedGroups = function(numberOfGroups, callbackIn){

// //     var groups = [];
// //     var groupIds = [];

// //     for( var i = 0; i < numberOfGroups; i++ ){ groups.push({}); }

// //     async.eachSeries(groups, function(group, callback){
// //         groupModel.add(group, function(err, groupId){
// //             if(err){ callback(err); }
// //             else{
// //                 groupIds.push(groupId)
// //                 callback();
// //             }
// //         })
// //     }, function(err){
// //         if(err){ callbackIn(err); }
// //         else{ callbackIn(null, groupIds); }
// //     })
// // }

// // passes back an array of all groupIds
// groupModel.getAllGroupIds = function(callbackIn){
//     knex('groups')
//         .select(['id'])
//         .then(function(rows){
//             var groupIds = _.map(rows, function(row){ return row.id; })
//             callbackIn(null, groupIds);
//         })
//         .catch(callbackIn)
// }


// // Takes array of group Ids
// // Takes returnMap flag
// // Returns an object with groupId as key and array of userIds as value if returnMap is false
// // else, returns an array of user ids
// groupModel.getUsersInGroups = function(groupIds, returnMap, callbackIn){
//     knex('groups_users')
//         .select(['user', 'group'])
//         .whereIn('group', groupIds)
//         .then(function(userGroups){
//             if( returnMap ){
//                 var groupUserMap = {};
//                 _.each(userGroups, function(userGroup){
//                     if( typeof(groupUserMap[userGroup.group]) === 'undefined' ){
//                         groupUserMap[userGroup.group] = [];
//                     }
//                     groupUserMap[userGroup.group].push(userGroup.user)
//                 })
//                 callbackIn(null, groupUserMap)
//             }else{
//                 userIds = _.uniq(_.flatten(_.map(userGroups, function(userGroup){
//                     return userGroup.user;
//                 })));
//                 callbackIn(null, userIds);
//             }
//         })
//         .catch(callbackIn)
// }

// groupModel.updateGroupVote = function(groupId, postId, vote, callbackIn){
//     var queryObj = voteModel.getMultiKeyVoteQuery( 'group_votes', 'post', postId, 'group', groupId, vote);
//     knex.raw(queryObj.statement, queryObj.params)
//         .then(function(){ callbackIn(); })
//         .catch(callbackIn);
// }

// groupModel.updateUserGroupAgreements = function(groupId, userId, postId, vote, callbackIn){
//     // retrieve group votes
//     knex('group_votes')
//         .select(['percentage_up', 'total'])
//         .where({post: postId, group: groupId})
//         .then(function(groupVoteIn){
//             var groupVote = groupVoteIn[0];
//             //determine agreement
//             var userAgreementVote =
//                 voteModel.getUserAgreementVote( vote, groupVote.percentage_up, groupVote.total);
//             // if not enough votes or tie, do nothing
//             if( userAgreementVote === null ){ callbackIn(); }
//             // update user_group_agreement
//             else {
//                 var updateObj = voteModel.getMultiKeyVoteQuery( 'user_group_agreements', 'user', userId, 'group', groupId, userAgreementVote);
//                 knex.raw(updateObj.statement, updateObj.params)
//                     .then(function(){ callbackIn(); })
//                     .catch(callbackIn)

//             }
//         })
//         .catch(callbackIn)
// }

// groupModel.updateUsersGroupVotes = function(userId, postId, vote, callbackIn){

//     var getGroups = require('./user').getGroups;

//     async.waterfall([
//         // get groups user belongs to
//         function(callback){
//             getGroups(userId, callback);
//         },
//         // update group votes
//         function(groupIds, callback){
//             async.eachSeries(groupIds, function(groupId, callbackB){
//                 groupModel.updateGroupVote(groupId, postId, vote, function(err){
//                     if(err){ callbackB(err); }
//                     else{
//                         // update user group agreements
//                         groupModel.updateUserGroupAgreements(groupId, userId, postId, vote, callbackB)
//                     }
//                 });
//             }, callback);
//         }
//     ], callbackIn);
// }

// /********************************************************************************
// GROUPING FUNCTIONS
// ********************************************************************************/

// // main grouping function, regroups users based on their agreement/disagreement
// //  with other group's users
// //
// // Takes the following settings:
// /*
//     settings = {

//         // when regrouping user, at most, this many groups will be checked
//         maximumGroupsToCompare: 3,

//         // If there are less than this many posts that both the user and the group
//         //  have voted on, the user will not be compared with the group
//         minimumGroupVotesToCompare: 10,


//         // If the user has less than this many votes with a particular group, they
//         //  can not be regrouped    
//         minimumVotesToIncludeInSort: 1,


//         // User must have at least this many votes to do a comparison
//         minimumVotesToDoUserComparison: 10,

//         // percentage of users in a group to regroup
//         percentUsersToRegroup: 0.5,

//         // maximum number of user votes that will get compared    
//         userPostVotesToCompare: 20,
//     }
// */
// groupModel.groupUsers = function(settings, groupIds, callbackIn){
//     async.eachSeries(groupIds, function(groupId, callback){
//         processGroup(settings, groupId, callback);
//     }, callbackIn);
// }

// function findGroupsUserDoesntBelongTo(settings, userId, callbackIn){

//     // find groups user does belong to
//     knex('groups_users')
//         .select('group')
//         .where('user', userId)
//         .then(function(groupRows){
//             var groupIds = _.pluck(groupRows, 'group');
//             // find groups user is not in
//             knex('groups')
//                 .select(['id'])
//                 .whereNotIn('id', groupIds)
//                 .then(function(groupObjs){
//                     var groups = _.shuffle(_.pluck(groupObjs, 'id'))
//                         .slice(0, settings.maximumGroupsToCompare);
//                     callbackIn(null, groups);
//                 })
//                 .catch(callbackIn)
//         })
//         .catch(callbackIn)
// }

// function userAgrees( userVote, percentageGroupUpVotes ){
//     if( (userVote === constants.upvote && percentageGroupUpVotes > 0.5) ||
//         (userVote === constants.downvote && percentageGroupUpVotes < 0.5) ){ return true; }
//     else { return false; }
// }

// // compares users votes on a set of posts with a groups
// function compareVotes(settings, groupId, postVotes, postVoteIds, callbackIn){
//     //get group votes for posts user voted for
//     knex('group_votes')
//         .select(['percentage_up', 'total', 'post'])
//         .where('group', groupId)
//         .whereIn('post', postVoteIds)
//         .then(function(groupVotes){
//             if( groupVotes < settings.minimumGroupVotesToCompare ){
//                 callbackIn(null, 0.0);
//             } else {
//                 var agreedVotes = 0;
//                 var totalVotes = 0;
//                 groupVotes.forEach(function(agreement){
//                     totalVotes += 1;
//                     var uv = postVotes[agreement.post];
//                     var gvp = agreement.percentage_up;
//                     if( userAgrees(uv, gvp) ){
//                         agreedVotes += 1;
//                     }
//                 });
//                 callbackIn(null, (agreedVotes / totalVotes));
//             }
//         })
//         .catch(callbackIn)
// }

// function compareUserWithAlternateGroups(settings, userId, userVotes, callback){

//     // find X number of groups user does not belong to
//     findGroupsUserDoesntBelongTo(settings, userId, function(err, groupIds){

//         if(err){ callback(err); }
//         else{
//             if( groupIds.length > 0 ){

//                 postVoteIds = [];
//                 postVotes = {};
//                 voteAgreements = [];

//                 userVotes.forEach(function(v){
//                     postVoteIds.push(v.post);
//                     postVotes[v.post] = v.vote;
//                 });

//                 async.eachSeries(groupIds, function(groupId, callback_b){
//                     compareVotes(settings, groupId, postVotes, postVoteIds, function(err, percentage){
//                         if( err ){ callback_b(err); }
//                         else{
//                             if( percentage !== null ){
//                                 voteAgreements.push({
//                                     groupId: groupId,
//                                     agreePercentage: percentage
//                                 });
//                             }
//                             callback_b();
//                         }
//                     })
//                 },
//                 function(err){
//                     if(err){ callback(err); }
//                     else{ callback(null, voteAgreements) }
//                 });
//             } else { callback(); }
//         }
//     });
// }


// // user agreements are records with user id and percentage of agreement with group
// function processUsers(settings, userAgreements, groupId, callbackIn){

//     // for each user agreement
//     async.eachSeries(userAgreements, function(agreement, callback){
//         // see if there are other groups user has higher agreement with
//         processUser(settings, agreement.user, groupId, function(err, newAgreements){
//             if(err){ callback(err); }
//             else{
//                 if( newAgreements.length < 1 ){ callback(); }
//                 else{
//                     regroupUser(
//                         agreement.user,
//                         groupId,
//                         agreement.percentage_up,
//                         newAgreements,
//                         callback
//                     );
//                 }
//             }
//         });
//     }, function(err){
//         if(err){ callbackIn(err); }
//         else{ callbackIn(); }
//     });
// }

// function processUser(settings, userId, groupId, callbackIn){
//     // find X number of user posts to compare to other groups vote's
//     knex('user_votes')
//         .select(['vote', 'post', 'created'])
//         .where('user', userId)
//         .orderBy('created', 'desc')
//         .limit(settings.userPostVotesToCompare)
//         .then(function(userVotes){
//             //check if user has enough votes to compare
//             if( userVotes.length > settings.minimumVotesToDoUserComparison ){
//                 compareUserWithAlternateGroups(settings, userId, userVotes, callbackIn);
//             } else {
//                 callbackIn(null, []);
//             }
//         })
//         .catch(callbackIn)
// }

// // Main function for processing and individual group.
// // Function finds all users in group, then takes the users with the lowest
// //  agreement and attempts to find, and regroup to, groups the users has
// //  a higher agreement with.
// function processGroup(settings, groupId, callbackIn){

//     var numberOfUsersInGroup;
//     var userAgreements;

//     async.waterfall(
//     [
//         // get total number of users
//         function(callback){

//             knex('groups_users')
//                 // .select(['group'])
//                 .count('*')
//                 .where('group', groupId)
//                 .then(function(count){
//                     numberOfUsersInGroup = count[0]['count(*)'];
//                     callback();
//                 })
//                 .catch(callback)
//         },

//         // get users that should be regrouped
//         function(callback){
//             knex('user_group_agreements')
//                 .select(['user', 'percentage_up'])
//                 .where('group', groupId)
//                 .andWhere('total', '>', settings.minimumVotesToIncludeInSort)
//                 .orderBy('percentage_up', 'asc')
//                 .limit(settings.numberOfUserToRegroup)
//                 .then(function(userAgreementsIn){
//                     userAgreements = userAgreementsIn;
//                     callback();
//                 })
//                 .catch(callback)
//         },

//         // try to find groups that user may have more agreements with
//         //   and regroup user
//         function(callback){
//             processUsers(settings, userAgreements, groupId, callback);
//         }

//     ], callbackIn);
// }

// function regroupUser(
//             userId,
//             currentGroupId,
//             currentGroupAgreement,
//             newGroupAgreements,
//             callback){

//     // sort newGroupAgreements
//     newGroupAgreements.sort(function(a, b){
//         return(b.agreePercentage - a.agreePercentage);
//     });

//     if( newGroupAgreements[0]['agreePercentage'] > currentGroupAgreement ){
//         unasignUser(userId, currentGroupId, function(err){
//             if(err){ callback(err) }
//             else{
//                 assignUser(userId, newGroupAgreements[0]['groupId'], function(err){
//                     if(err){ callback(err); }
//                     else{
//                         callback();
//                     }
//                 });
//             }
//         })
//     } else { callback(); }
// }

// function unasignUser(userId, groupId, callbackIn){

//     var whereObj = {
//         user: userId,
//         group: groupId
//     }

//     // remove user group agreements
//     knex('user_group_agreements')
//         .where(whereObj)
//         .del()
//         .then(function(){
//             // remove user from group
//             knex('groups_users')
//                 .where(whereObj)
//                 .del()
//                 .then(function(){ callbackIn(); })
//                 .catch(callbackIn)
//         })
//         .catch(callbackIn)
// }

// function assignUser(userId, groupId, callbackIn){

//     // callbackIn(); return;
//     knex('groups_users')
//         .insert({
//             'group': groupId,
//             'user': userId
//         })
//         .then(function(){ callbackIn(); })
//         .catch(callbackIn)
// }

// module.exports = groupModel;

// }())