(function(){


var groupModel = {};

var _ = require('underscore');
var async = require('async');
var baseModel = require('./base');
var constants = require('../constants');
var knex = global.grouper_app.get('GROUPER_KNEX');
var voteModel = require('./vote');

var settings = {
    // groupsToCompareUser: 2,
    maximumGroupsToCompare: 10,
    minimumGroupVotesToCompare: 10,
    minimumVotesToIncludeInSort: 1,
    minimumVotesToDoUserComparison: 10,
    percentUsersToRegroup: 0.3,
    userPostVotesToCompare: 50,
}

groupModel.add = function(groupData, callbackIn){
    baseModel.add('groups', {}, callbackIn);
}

groupModel.assignUserToGroup = function(userId, groupId, callbackIn){

    knex('groups_users')
        .insert({ user: userId, group: groupId })
        .then(function(rows){ callbackIn(null, rows[0]); })
        .catch(callbackIn)
        // if( err.code === 'ER_DUP_ENTRY' ){ callback(); }
}


groupModel.assignUsersToGroups = function(groupIds, userIds, numberOfGroupsUserBelongsTo, callbackIn){
    var count;
    var currentGroup = 0;

    async.eachSeries(userIds, function(userId, callback){
        count = 0;
        async.whilst(
            function(){ return count < numberOfGroupsUserBelongsTo },
            function(callbackB){
                groupModel.assignUserToGroup(userId, groupIds[currentGroup], function(err){
                    if(err){ callbackB(err); }
                    else{
                        count++;
                        currentGroup++;
                        if( currentGroup === groupIds.length ){ currentGroup = 0; }
                        callbackB();
                    }
                });
            },
            callback
        )
    }, callbackIn)
}

groupModel.createSeedGroups = function(numberOfGroups, callbackIn){

    var groups = [];
    var groupIds = [];

    for( var i = 0; i < numberOfGroups; i++ ){ groups.push({}); }

    async.eachSeries(groups, function(group, callback){
        groupModel.add(group, function(err, groupId){
            if(err){ callback(err); }
            else{
                groupIds.push(groupId)
                callback();
            }
        })
    }, function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(null, groupIds); }
    })
}

groupModel.updateGroupVote = function(groupId, postId, vote, callbackIn){
    var queryObj = voteModel.getMultiKeyVoteQuery( 'group_votes', 'post', postId, 'group', groupId, vote);
    knex.raw(queryObj.statement, queryObj.params)
        .then(function(){ callbackIn(); })
        .catch(callbackIn);
}

groupModel.updateUserGroupAgreements = function(groupId, userId, postId, vote, callbackIn){
    // retrieve group votes
    knex('group_votes')
        .select(['percentage_up', 'total'])
        .where({post: postId, group: groupId})
        .then(function(groupVoteIn){
            var groupVote = groupVoteIn[0];
            //determine agreement
            var userAgreementVote =
                voteModel.getUserAgreementVote( vote, groupVote.percentage_up, groupVote.total);
            // if not enough votes or tie, do nothing
            if( userAgreementVote === null ){ callbackIn(); }
            // update user_group_agreement
            else {
                var updateObj = voteModel.getMultiKeyVoteQuery( 'user_group_agreements', 'user', userId, 'group', groupId, userAgreementVote);
                knex.raw(updateObj.statement, updateObj.params)
                    .then(function(){ callbackIn(); })
                    .catch(callbackIn)

            }
        })
        .catch(callbackIn)
}

groupModel.updateUsersGroupVotes = function(userId, postId, vote, callbackIn){

    var getGroups = require('./user').getGroups;

    async.waterfall([
        // get groups user belongs to
        function(callback){
            getGroups(userId, callback);
        },
        // update group votes
        function(groupIds, callback){
            async.eachSeries(groupIds, function(groupId, callbackB){
                groupModel.updateGroupVote(groupId, postId, vote, function(err){
                    if(err){ callbackB(err); }
                    else{
                        // update user group agreements
                        groupModel.updateUserGroupAgreements(groupId, userId, postId, vote, callbackB)
                    }
                });
            }, callback);
        }
    ], callbackIn);
}



/********************************************************************************
GROUPING FUNCTIONS
********************************************************************************/


groupModel.groupUsers = function(groupIds, callbackIn){
    async.eachSeries(groupIds, function(groupId, callback){
        processGroup(groupId, callback);
    }, callbackIn);
}

function findGroupsUserDoesntBelongTo(userId, callbackIn){

    // find groups user does belong to
    knex('groups_users')
        .select('group')
        .where('user', userId)
        .then(function(groupRows){
            var groupIds = _.pluck(groupRows, 'group');
            // find groups user is not in
            knex('groups')
                .select(['id'])
                // .where('user', '!=', userId)
                .whereNotIn('id', groupIds)
                .then(function(groupObjs){
                    var groups = _.shuffle(_.pluck(groupObjs, 'id'))
                        .slice(0, settings.maximumGroupsToCompare);
                    callbackIn(null, groups);
                })
                .catch(callbackIn)
        })
        .catch(callbackIn)


// console.log(userId);
//     knex('groups_users')
//         .select(['group'])
//         // .where('user', '!=', userId)
//         .whereNotIn('user', [userId])
//         .then(function(userGroups){
// // console.log(userGroups); return;
//             var groups = _.shuffle(_.pluck(userGroups, 'group'))
//                 .slice(0, settings.maximumGroupsToCompare);
//             callbackIn(null, groups);
//         })
//         .catch(callbackIn)
}

function userAgrees( userVote, percentageGroupUpVotes ){
    if( (userVote === constants.upvote && percentageGroupUpVotes > 0.5) ||
        (userVote === constants.downvote && percentageGroupUpVotes < 0.5) ){ return true; }
    else { return false; }
}

// compares users votes on a set of posts with a groups
function compareVotes(groupId, postVotes, postVoteIds, callbackIn){
// console.log(postVoteIds);
    //get group votes for posts user voted for
    knex('group_votes')
        .select(['percentage_up', 'total', 'post'])
        .where('group', groupId)
        .whereIn('post', postVoteIds)
        .then(function(groupVotes){
// console.log(groupVotes);
// return;
            if( groupVotes < settings.minimumGroupVotesToCompare ){
                callbackIn(null, 0.0);
            } else {
// console.log('else');
                var agreedVotes = 0;
                var totalVotes = 0;
                groupVotes.forEach(function(agreement){
                    totalVotes += 1;

                    // user vote
                    // var uv = postVotes[agreement.postId];
                    var uv = postVotes[agreement.post];
// console.log('user')
// console.log(postVotes[agreement.post]);
                    // group vote perentage
                    var gvp = agreement.percentage_up;
// console.log('group')
// console.log(gvp)
                    if( userAgrees(uv, gvp) ){
                        agreedVotes += 1;
                    }
                });
// console.log(agreedVotes)
// console.log(totalVotes)
// return;
                callbackIn(null, (agreedVotes / totalVotes));
            }
        })
        .catch(callbackIn)
}

function compareUserWithAlternateGroups(userId, userVotes, callback){

    // find X number of groups user does not belong to
    findGroupsUserDoesntBelongTo(userId, function(err, groupIds){

        if(err){ callback(err); }
        else{
            if( groupIds.length > 0 ){

                postVoteIds = [];
                postVotes = {};
                voteAgreements = [];

                userVotes.forEach(function(v){
                    postVoteIds.push(v.post);
                    postVotes[v.post] = v.vote;
                });

                async.eachSeries(groupIds, function(groupId, callback_b){
                    compareVotes(groupId, postVotes, postVoteIds, function(err, percentage){
                        if( err ){ callback_b(err); }
                        else{
                            if( percentage !== null ){
                                voteAgreements.push({
                                    groupId: groupId,
                                    agreePercentage: percentage
                                });
                            }
                            callback_b();
                        }
                    })
                },
                function(err){
                    if(err){ callback(err); }
                    else{ callback(null, voteAgreements) }
                });
            } else { callback(); }
        }
    });
}


// user agreements are records with user id and percentage of agreement with group
function processUsers(userAgreements, groupId, callbackIn){

    // for each user agreement
    async.eachSeries(userAgreements, function(agreement, callback){
        // see if there are other groups user has higher agreement with
        processUser(agreement.user, groupId, function(err, newAgreements){
            if(err){ callback(err); }
            else{
// console.log('hhhh');
// console.log(newAgreements);
                if( newAgreements.length < 1 ){ callback(); }
                else{
// console.log('cccc');
                    regroupUser(
                        agreement.user,
                        groupId,
                        agreement.percentage_up,
                        newAgreements,
                        callback
                    );
                }
            }
        });
    }, function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(); }
    });


}

function processUser(userId, groupId, callbackIn){
    // find X number of user posts to compare to other groups vote's
    knex('user_votes')
        .select(['vote', 'post', 'created'])
        .where('user', userId)
        .orderBy('created', 'desc')
        .limit(settings.userPostVotesToCompare)
        .then(function(userVotes){
// console.log(userVotes.length); return;
            //check if user has enough votes to compare
            if( userVotes.length > settings.minimumVotesToDoUserComparison ){
                compareUserWithAlternateGroups(userId, userVotes, callbackIn);
            } else {
                callbackIn(null, []);
            }
        })
        .catch(callbackIn)


    // find X number user posts
    // norm.table('UserVotes')
    //     .where('user', '=', userId)
    //     .select(['vote', 'post'])
    //     .orderDesc('id')
    //     .limit(settings.userPostVotesToCompare)
    //     .findAll(function(err, userVotes){
    //         if(err){ callbackIn(err); }
    //         else{
    //             //check if user has enough votes to compare
    //             if( userVotes.length > settings.minimumVotesToDoUserComparison ){
    //                 compareUserWithAlternateGroups(userId, userVotes, callbackIn);
    //             } else {
    //                 callbackIn();
    //             }
    //         }
    //     })
}

function processGroup(groupId, callbackIn){

    var numberOfUsersInGroup;
    var userAgreements;

    async.waterfall(
    [
        // get total number of users
        function(callback){

            knex('groups_users')
                // .select(['group'])
                .count('*')
                .where('group', groupId)
                .then(function(count){
                    numberOfUsersInGroup = count[0]['count(*)'];
                    callback();
                })
                .catch(callback)
        },

        // get users that should be regrouped
        function(callback){
            knex('user_group_agreements')
                .select(['user', 'percentage_up'])
                .where('group', groupId)
                .andWhere('total', '>', settings.minimumVotesToIncludeInSort)
                .orderBy('percentage_up', 'asc')
                .limit(settings.numberOfUserToRegroup)
                .then(function(userAgreementsIn){
                    userAgreements = userAgreementsIn;
                    callback();
                })
                .catch(callback)
        },

        // try to find groups that user may have more agreements with
        //   and regroup user
        function(callback){
            processUsers(userAgreements, groupId, callback);
        }




        // try to find groups that user may have more agreements with
        //   and regroup user
        // function(agreements, callback){
        //     async.eachSeries(agreements, function(agreement, agreementCallback){
        //         processUser(agreement.user, groupId, function(err, newAgreements){
        //             if(err){ agreementCallback(err); }
        //             else{
        //                 if( newAgreements.length < 1 ){ agreementCallback(); }
        //                 else{

        //                     regroupUser(
        //                         agreement.user,
        //                         groupId,
        //                         agreement.percentageUp,
        //                         newAgreements,
        //                         agreementCallback
        //                     );
        //                 }
        //             }
        //         });
        //     }, function(err){
        //         if(err){ callback(err); }
        //         else{ callback(); }
        //     });
        // }
    ], callbackIn);
}

function regroupUser(
            userId,
            currentGroupId,
            currentGroupAgreement,
            newGroupAgreements,
            callback){

// console.log(currentGroupAgreement);
// console.log(newGroupAgreements);
// return;

    // sort newGroupAgreements
    newGroupAgreements.sort(function(a, b){
        return(b.agreePercentage - a.agreePercentage);
    });

// console.log(newGroupAgreements);
// return

// console.log(newGroupAgreements[0]['agreePercentage']);
// console.log(currentGroupAgreement);

    // if agreement with new group is higher, unassign from old, reasign to new
// console.log(newGroupAgreements);
// console.log(userId); return;
    if( newGroupAgreements[0]['agreePercentage'] > currentGroupAgreement ){
        unasignUser(userId, currentGroupId, function(err){
            if(err){ callback(err) }
            else{
                assignUser(userId, newGroupAgreements[0]['groupId'], function(err){
                    if(err){ callback(err); }
                    else{
                        callback();
                    }
                });
            }
        })
    } else { callback(); }
}

function unasignUser(userId, groupId, callbackIn){

    var whereObj = {
        user: userId,
        group: groupId
    }

    // remove user group agreements
    knex('user_group_agreements')
        .where(whereObj)
        .del()
        .then(function(){
            // remove user from group
            knex('groups_users')
                .where(whereObj)
                .del()
                .then(function(){ callbackIn(); })
                .catch(callbackIn)
        })
        .catch(callbackIn)


    // remove user group agreements
    // norm.table('UserGroupAgreements')
    //     .where('user', '=', userId)
    //     .where('group', '=', groupId)
    //     .delete(function(err){
    //         if( err ){ callback(err); }
    //         else{
    //             // remove user from group
    //             norm.table('GroupsUsers')
    //                 .where('userId', '=', userId)
    //                 .where('groupId', '=', groupId)
    //                 .delete(callback);
    //         }
    //     });
}

function assignUser(userId, groupId, callbackIn){

    // callbackIn(); return;
    knex('groups_users')
        .insert({
            'group': groupId,
            'user': userId
        })
        .then(function(){ callbackIn(); })
        .catch(callbackIn)

    // norm.table('GroupsUsers')
    //     .insert({
    //         'GroupId': groupId,
    //         'UserId': userId
    //     }, function(err){
    //         if( err ){
    //             if( err.code === 'ER_DUP_ENTRY' ){ callback(); }
    //             else{ callback(err); }
    //         } else { callback(); }
    //     });
}

module.exports = groupModel;

}())