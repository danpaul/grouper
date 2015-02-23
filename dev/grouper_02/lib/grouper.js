var grouper = {}

var config = require('../config')

var async = require('async')
var _ = require('underscore')

var models = require('../models/models')

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
settings should include:
	minimumVotesToIncludeInSort (users with fewer votes will not be regrouped)
    numberOfUserToRegroup (number of users that should be attempted to be
        regrouped)
    userPostVotesToCompare (number of user votes that get compated)
    minimumVotesToDoUserComparison (users with fewer than these votes will
        not get compared)
    maximumGroupsToCompare (maximum number of groups user will be compared
        to when regrouping)
*/
grouper.groupUsers = function(settings, groupIds, callbackIn){
    async.eachSeries(groupIds, function(groupId, callback){
        grouper.processGroup(settings, groupId, callback);
    }, callbackIn);
}

/**
* Main function for processing and individual group.
* Function finds all users in group, then takes the users with the lowest
*  agreement and attempts to find, and regroup to, groups the users has
*  a higher agreement with.
* Settings should include same options as grouper.groupUsers
*/
grouper.processGroup = function(settings, groupId, callbackIn){

    var numberOfUsersInGroup;
    var userAgreements;

    async.waterfall(
    [
        // get total number of users
        function(callback){
        	models.user.countInGroup(groupId, function(err, count){
        		if( err ){ callback(err) }
        		else{
        			numberOfUsersInGroup = count;
        			callback()
        		}
        	})
        },

        // get users with lowest group agreement
        function(callback){
            models.userGroupAgreement.getUsersToRegroup(
                groupId,
                settings.numberOfUserToRegroup,
                settings.minimumVotesToIncludeInSort,
                function(err, userAgreementsIn){

                    if(err){ callback(err) }
                    else{
                        userAgreements = userAgreementsIn
                        callback()
                    }
            })
        },

        // process and regroup users
        function(callback){
            grouper.processUsers(settings, userAgreements, groupId, callback);
        }

    ], callbackIn);
}

/******************************************************************************/
// user agreements are records with user id and percentage of agreement with
//  group
grouper.processUsers = function(settings, userAgreements, groupId, callbackIn){

    async.eachSeries(userAgreements, function(agreement, callback){

        // see if there are other groups user has higher agreement with
        grouper.processUser(settings,
                    agreement.user,
                    groupId,
                    agreement.percentage_up,
                    function(err, newAgreements){
console.log('here')
return;
            // if(err){ callback(err); }
            // else{

            //     if( newAgreements.length < 1 ){ callback(); }
            //     else{
            //         regroupUser(
            //             agreement.user,
            //             groupId,
            //             agreement.percentage_up,
            //             newAgreements,
            //             callback
            //         );
            //     }
            // }
        });
    }, function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(); }
    });
}

/******************************************************************************/
grouper.processUser = function(settings,
                               userId,
                               groupId,
                               currentGroupAgreement,
                               callbackIn){

    // find user's recent votes
    models.userVote.getRecentVotes(userId,
                                   settings.userPostVotesToCompare,
                                   function(err, userVotes){

        if( userVotes.length > settings.minimumVotesToDoUserComparison ){

            grouper.compareUserWithGroups(settings,
                                          userId,
                                          userVotes,
                                          function(err, userGroupAgreements){

                if(err){ callbackIn(err); }
                else{

                    if( userGroupAgreements.length < 1 ){ callbackIn(); }
                    else{

                        grouper.regroupUser(
                            userId,
                            groupId,
                            currentGroupAgreement,
                            userGroupAgreements,
                            callbackIn
                        );
                    }
                }

            });
        } else {
            callbackIn(null, []);
        }
    })
}

grouper.compareUserWithGroups = function(settings,
                                         userId,
                                         userVotes,
                                         callbackIn){

    var groupIds;

    async.waterfall([

        // Get groups user does not belong to.
        function(callback){

            grouper.findGroupsUserDoesntBelongTo(settings,
                                                 userId,
                                                 callback)

        },

        function(groupIdsIn, callback){

            groupIds = groupIdsIn;

            var postVoteIds = [];
            var postVotes = {};
            var voteAgreements = [];

            if( groupIds.length === 0 ){
                callback()
                return
            }

            userVotes.forEach(function(v){
                postVoteIds.push(v.post);
                postVotes[v.post] = v.vote;
            });

            // check other groups
            async.eachSeries(groupIds, function(groupId, callbackB){

                grouper.compareVotes(settings,
                                     groupId,
                                     postVotes,
                                     postVoteIds,
                                     function(err, agreementPercentageIn){

                    if( err ){ callbackB(err); }
                    else{

                        voteAgreements.push({
                            groupId: groupId,
                            agreePercentage: agreementPercentageIn
                        });

                        callbackB();
                    }
                })
            },

            function(err){
                if(err){ callback(err); }
                else{ callback(null, voteAgreements) }
            });

        }


    ], callbackIn)

    // find X number of groups user does not belong to
    // grouper.findGroupsUserDoesntBelongTo(settings,
    //                                      userId,
    //                                      function(err, groupIds){

// console.log('aaaaa')
return;

    //     if(err){ callback(err); }
    //     else{
    //         if( groupIds.length > 0 ){

    //             postVoteIds = [];
    //             postVotes = {};
    //             voteAgreements = [];

    //             userVotes.forEach(function(v){
    //                 postVoteIds.push(v.post);
    //                 postVotes[v.post] = v.vote;
    //             });

    //             async.eachSeries(groupIds, function(groupId, callback_b){
    //                 compareVotes(settings, groupId, postVotes, postVoteIds, function(err, percentage){
    //                     if( err ){ callback_b(err); }
    //                     else{
    //                         if( percentage !== null ){
    //                             voteAgreements.push({
    //                                 groupId: groupId,
    //                                 agreePercentage: percentage
    //                             });
    //                         }
    //                         callback_b();
    //                     }
    //                 })
    //             },
    //             function(err){
    //                 if(err){ callback(err); }
    //                 else{ callback(null, voteAgreements) }
    //             });
    //         } else { callback(); }
    //     }
    // });
}

/******************************************************************************/

/**
* Passes back random number of groups user does not belong to.
*/
grouper.findGroupsUserDoesntBelongTo = function(settings, userId, callbackIn){

    // get user data (to find user group)
    models.user.get(userId, function(err, user){
        if( err ){
            callbackIn(err)
            return
        }

        models.group.getRandom(settings.maximumGroupsToCompare + 1,
                               function(err, groups){

            if( err ){ callbackIn(err) }
            else{
                groups = _.reject(groups,
                                  function(g){ return(g === user.group) });

                if( groups.length > settings.maximumGroupsToCompare ){
                    groups.pop()
                }
                callbackIn(null, groups)
            }
        })

    })
}

/**
* Takes a group id and compares users votes with it
* Passes back a percentage between 0 - 1.0 expressing the percenage of
*   times the user agress with the group.
*/
grouper.compareVotes = function(settings,
                                groupId,
                                userPostVotes,
                                postIds,
                                callbackIn){

    models.groupVote.getGroupPostVotes(groupId,
                                       postIds,
                                       settings.minimumGroupVotesToCompare,
                                       function(err, groupVotes){

        if( groupVotes < settings.minimumGroupVotesToCompare ){
            callbackIn(null, 0.0);
            return;
        }

        var agreedVotes = 0;
        var totalVotes = 0;

        groupVotes.forEach(function(groupVote){

            totalVotes += 1;
            var userVote = userPostVotes[groupVote.post];

            if( grouper.userAgrees(userVote, groupVote.percentage_up) ){
                agreedVotes += 1;
            }

        });

        callbackIn(null, (agreedVotes / totalVotes));

    })


// console.log(postVoteIds)

// console.log('here')
// return;
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
//                     if( grouper.userAgrees(uv, gvp) ){
//                         agreedVotes += 1;
//                     }
//                 });
//                 callbackIn(null, (agreedVotes / totalVotes));
//             }
//         })
//         .catch(callbackIn)
}


/**
* Processes comparing user's votes to other groups votes.
* If user agrees with another group more than current group, user gets
*   regrouped otherwise nothing happens.
*/
grouper.regroupUser = function(userId,
                               currentGroupId,
                               currentGroupAgreement,
                               newGroupAgreements,
                               callback){

    newGroupAgreements.sort(function(a, b){
        return(b.agreePercentage - a.agreePercentage);
    });

// asdf
console.log(newGroupAgreements)
return;

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

/*******************************************************************************

                            HELPER FUNCTIONS

*******************************************************************************/

grouper.userAgrees = function(userVote, percentageGroupUpVotes){

    if( (userVote === config.UPVOTE && percentageGroupUpVotes > 0.5) ||
        (userVote === config.DOWNVOTE && percentageGroupUpVotes < 0.5) ){

        return true;

    } else {

        return false;
    }
}

module.exports = grouper