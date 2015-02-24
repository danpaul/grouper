/**
* This function tests the effectiveness of user groupings.
*/

var groupTest = {}

var config = require('../config')

var async = require('async');
var _ = require('underscore');

var grouper = require('../lib/grouper')
var seed = require('../lib/seed')
var userVoteModel = require('../models/user_vote')
var userModel = require('../models/user')
var voteModel = require('../models/vote')

/*******************************************************************************

                            DRIVER FUNCTION

*******************************************************************************/

groupTest.runTest = function(settings, callbackIn){

    var groupIds;
    var userIds;
    // var groupings;

    async.waterfall([

        // seed groups and users
        // create groups
        function(callback){
            seed.groups(settings.numberOfGroups, callback);
        },
        function(groupIdsIn, callback){
            groupIds = groupIdsIn;
            callback();
        },
        // create users
        function(callback){
            seed.users(settings.numberOfUsers, callback)
        },
        // confirm users created
        function(userIdsIn, callback){
            userIds = userIdsIn;
            callback();
        },

        // assign users to groups
        function(callback){
            seed.assignUsersToGroups(groupIds, userIds, callback);
        },

    // vote cycle
    function(callback){
        groupTest.voteGroupCycle({
            userIds: userIds,
            groupIds: groupIds,
            numberOfGroupings: settings.numberOfGroupings,
            numberOfCycles: settings.numberOfCycles,
            numberOfPosts: settings.numberOfPosts,
            testBias: settings.testBias,
            minimumVotesToIncludeInSort: settings.minimumVotesToIncludeInSort,
            numberOfUserToRegroup: settings.numberOfUserToRegroup,
            userPostVotesToCompare: settings.userPostVotesToCompare,
            minimumVotesToDoUserComparison: settings.minimumVotesToDoUserComparison,
            maximumGroupsToCompare: settings.maximumGroupsToCompare
        }, callback)
    }

    ], function(err, averages){
        if(err){
            callbackIn(err)
            return;
        } else {
            callbackIn(null, averages);
            return;
        }
    })
}

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

groupTest.voteGroupCycle = function(settings, callbackIn){

    // create groupings
    var groupings = groupTest.createGroupings(settings.userIds,
                                              settings.numberOfGroupings);
    var cycleNumber = 0;
    var groupAverages  = [];

    // // foreach cycle
    async.eachSeries(_.range(settings.numberOfCycles),
                     function(number, callback){

        var postIds = []
        cycleNumber++

        async.waterfall([
            // seed posts
            function(callbackB){
                seed.posts(settings.numberOfPosts,
                           settings.userIds[0],
                           function(err, postIdsIn){

                    if( err ){ callbackB(err); }
                    else{ postIds = postIdsIn; callbackB(); }
                });
            },
            // have all users vote
            function(callbackB){
                groupTest.voteCycle(settings.userIds,
                                    postIds,
                                    groupings,
                                    settings,
                                    callbackB);
            },
            // group users based on their votes
            function(callbackB){
                grouper.groupUsers(settings, settings.groupIds, callbackB)
            },

            // display grouping statistics
            function(callbackB){
                groupTest.getGroupStatistics(settings.userIds,
                                             settings.groupIds,
                                             groupings,
                                             function(err, totalAverage){

                    if(err){ callbackB(err); }
                    else{
                        groupAverages.push([cycleNumber, totalAverage]);
                        callbackB();
                    }
                });
            }
        ], function(err){
            if(err){ callback(err); }
            else{
                callback()
            }
        })
    }, function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(null, groupAverages); }
    })
}

/**
* Runs through a single vote cycle for a group of posts.
* Groupints are a 2d array of userIDs.
* User should tend to agree with users in their groupings
*/
groupTest.voteCycle = function(userIds,
                               postIds,
                               groupings,
                               settings,
                               callbackIn){

    async.eachSeries(postIds, function(postId, callback){

        var shuffledGroupings = _.shuffle(groupings);

        async.eachSeries(shuffledGroupings, function(grouping, callbackB){
            var shuffledUsers = _.shuffle(grouping)
            var bias = voteModel.getRandomBias(settings.testBias);

            async.eachSeries(shuffledUsers, function(userId, callbackC){
                var vote = voteModel.getVoteFromBias(bias);
                userVoteModel.vote(userId, null, postId, vote, callbackC)
            }, callbackB)

        }, callback);
    }, callbackIn);
}

/**
* Get group statistics which are the percenage of users who are in the
*   correct group.
*/
groupTest.getGroupStatistics = function(userIds,
                                        groupIds,
                                        groupings,
                                        callbackIn){
    var totalAverages = 0.0;

    // foreach user
    async.eachSeries(userIds, function(userId, callback){

        var usersInUsersGrouping;

        // find other users in this users groupings
        _.each(groupings, function(grouping){
            if( _.contains(grouping, userId) ){
                usersInUsersGrouping = grouping;
            }
        })

        userModel.get(userId, function(err, user){
            if( err ){
                callback(err)
                return
            }

            userModel.getUsersInGroup(user.group,
                                      function(err, usersInUsersGroup){

                if( err ){
                    callback(err)
                    return
                }

                var numUsersInBothGroups = _.intersection(usersInUsersGrouping,
                                                          usersInUsersGroup)
                                                          .length;

                totalAverages += (numUsersInBothGroups /
                                  usersInUsersGrouping.length);
                callback();
            })
        })
    }, function(err){
        if( err ){ callbackIn(err); }
        else{
            var average = totalAverages / userIds.length;
            console.log('Total average: ' +  average);
            callbackIn(null, average);
        }
    });
}

/*******************************************************************************

                            HELPER FUNCTIONS

*******************************************************************************/

// creates groupings of users like this: [[0, 1, 2], [3, 4, 5]]
// Instead of [[0, 2, 4], [1, 3, 5]]
groupTest.createGroupings = function(userIds, numberOfGroupings){
    var groupings = _.range(numberOfGroupings).map(function(){ return []; });
    var groupingCount = _.range(numberOfGroupings).map(function(){ return 0; });

    // determine how many users will be in each grouping (there is prob. a better way to do this)
    var count = 0;
    _.each(userIds, function(){
        groupingCount[count]++;
        if( count === (numberOfGroupings - 1) ){ count = 0; }
        else{ count++; }
    })

    // assign users to groupings
    var groupingIndex = 0;
    var userIndex = 0;
    _.each(groupingCount, function(groupCount){
        // push groupCount many users to grouping
        _.each(_.range(groupCount), function(){
            groupings[groupingIndex].push(userIds[userIndex]);
            userIndex++;
        })
        groupingIndex++;
    })
    return groupings;
}

module.exports = groupTest