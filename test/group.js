(function () {

var _ = require('underscore');
var async = require('async');
var assert = require('assert');

var constants = require('../constants.js');
var testHelpers = require('./test_helpers.js');

var groupModel = require('../models/group');
var postModel = require('../models/post');
var userModel = require('../models/user');
var voteModel = require('../models/vote');

var groupTest = {};

var settings = {
    numberOfCycles: 20,
    numberOfUsers: 20,
    numberOfGroups: 3,
    numberOfGroupings: 3,
    numberOfPosts: 20,
    testBias: 0.4
}

groupTest.runTest = function(groupingSettings, callbackIn){
    var seedData;
    var groupings;
    async.waterfall([
        // empty database
        testHelpers.emptyDatabase,
        // create groups, users, posts
        function(callback){
            testHelpers.createGroupsUsers(settings.numberOfGroups, settings.numberOfUsers, function(err, seedDataIn){
                if(err){ callback(err); }
                else{ seedData = seedDataIn; callback(); }
            })
        },
        // assign users to groups
        function(callback){
            groupModel.assignUsersToGroups(seedData.groups, seedData.users, 1, callback);
        },
        // vote cycle
        function(callback){
            voteGroupCycle(seedData.users, seedData.groups, settings.numberOfGroupings, settings.numberOfCycles, settings.numberOfPosts, groupingSettings, callback);
        }
    ], callbackIn)
}

groupTest.runTests = function(callback){


    var groupingSettings = {

        // when regrouping user, at most, this many groups will be checked
        maximumGroupsToCompare: 3,

        // If there are less than this many posts that both the user and the group
        //  have voted on, the user will not be compared with the group
        minimumGroupVotesToCompare: 10,

        // If the user has less than this many votes with a particular group, they
        //  can not be regrouped    
        minimumVotesToIncludeInSort: 1,

        // User must have at least this many votes to do a comparison
        minimumVotesToDoUserComparison: 10,

        // percentage of users in a group to regroup
        percentUsersToRegroup: 0.5,

        // maximum number of user votes that will get compared    
        userPostVotesToCompare: 20,
    }

    groupTest.runTest(groupingSettings, callback);

}


var voteGroupCycle = function(userIds, groupIds, numberOfGroupings, numberOfCycles, numberOfPosts, groupingSettings, callbackIn){

    // create groupings
    var groupings = createGroupings(userIds, numberOfGroupings);

    // // foreach cycle
    async.eachSeries(_.range(settings.numberOfCycles), function(number, callback){
        var postIds = [];

        async.waterfall([

            // create new posts
            function(callbackB){
                postModel.createSeedPosts(numberOfPosts, userIds[0], function(err, postIdsIn){
                    if( err ){ callbackB(err); }
                    else{ postIds = postIdsIn; callbackB(); }
                });
            },
            // have all users vote
            function(callbackB){
                voteCycle(userIds, postIds, groupings, callbackB);
            },
            // group users based on their votes
            function(callbackB){
                groupModel.groupUsers(groupingSettings, groupIds, callbackB);
            },            
            // // display grouping statistics
            function(callbackB){
                var statistics = getGroupStatistics(userIds, groupIds, groupings, callbackB);
            }

        ], callback)
    }, callbackIn)
}

getGroupStatistics = function(userIds, groupIds, groupings, callbackIn){
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

        // get groups user belongs to
        userModel.getGroups(userId, function(err, groupsUserBelongsTo){
            if( err ){ callback(err); }
            else{
                // get users in user's groups
                groupModel.getUsersInGroups(groupsUserBelongsTo, false, function(err, usersInUsersGroup){

                    if(err){ callback(err); }
                    else{
                        var numUsersInBothGroups = _.intersection(usersInUsersGrouping, usersInUsersGroup).length;
                        totalAverages += (numUsersInBothGroups / usersInUsersGrouping.length);
                        callback();
                    }
                });
            }
        })
    }, function(err){
        if( err ){ callbackIn(err); }
        else{
            var average = totalAverages / userIds.length;
            console.log('Total average: ' +  average);
            callbackIn();
        }
    });
}



// runs through a single vote cycle for a group of posts
// groupins are a 2d array of userIDs, user should tend to agree with users in their groupings
var voteCycle = function(userIds, postIds, groupings, callbackIn){
    // // foreach post
    async.eachSeries(postIds, function(postId, callback){
        //shuffle groupings
        var shuffledGroupings = _.shuffle(groupings);
        // foreach grouping
        async.eachSeries(shuffledGroupings, function(grouping, callbackB){
            // shuffle users
            var shuffledUsers = _.shuffle(grouping)
            // determine bias
            var bias = voteModel.getRandomBias(settings.testBias);
            //foreach user
            async.eachSeries(shuffledUsers, function(userId, callbackC){
                // cast vote
                var vote = voteModel.getVoteFromBias(bias);
                userModel.castVote(userId, postId, vote, callbackC);
            }, callbackB)
        }, callback);
    }, callbackIn);
}

// creates groupings in the "oposite" the way groupModel.assignUsersToGroups does
// I.e. [[0, 1, 2], [3, 4, 5]] instead of [[0, 2, 4], [1, 3, 5]]
var createGroupings = function(userIds, numberOfGroupings){
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

module.exports = groupTest;

}());