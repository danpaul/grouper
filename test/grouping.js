(function () {


var grouping = {};

var _ = require('underscore');
var async = require('async');
var assert = require('assert');
var constants = require('../constants.js');
var groupModel = require('../models/group');
var groupVoteModel = require('../models/group_vote');
var postModel = require('../models/post');
var userModel = require('../models/user');
var voteModel = require('../models/vote');


// var settings = {
//     numberOfGroups: 100, // should be at least 10
//     numberOfPosts: 10000, // should be at least 10
//     numberOfUsers: 1000, // should be at least 10
//     numberOfGroupings: 10,
//     numberOfGroupsUserBelongsTo: 20,
//     numberOfGroupingsUserBelongsTo: 3,
//     testBias: 0.1
// }

var settings = {
    numberOfGroups: 10, // should be at least 10
    numberOfGroupsUserBelongsTo: 3,
    numberOfPosts: 1000, // should be at least 10
    numberOfUsers: 100, // should be at least 10
    numberOfGroupings: 10,
    numberOfGroupingsUserBelongsTo: 5,
    testBias: 0.1
}

grouping.runTest = function(callbackIn){
    var goupIds;
    var userIds;
    var postIds;

    async.waterfall([

    // seed groups
    function(callback){

        groupModel.createSeedGroups(settings.numberOfGroups, function(err, groupIdsIn){
            if( err ){ callback(err); }
            else{ groupIds = groupIdsIn; callback(); }
        });
    },

    // seed users
    function(callback){
        userModel.createSeedUsers(settings.numberOfUsers, function(err, userIdsIn){
            if( err ){ callback(err); }
            else{ userIds = userIdsIn; callback(); }
        });
    },

    // create posts
    function(callback){
        postModel.createSeedPosts(settings.numberOfPosts, userIds[0], function(err, postIdsIn){
            if( err ){ callback(err); }
            else{ postIds = postIdsIn; callback(); }
        });
    },

    // assign users to groups
    function(callback){
        groupModel.assignUsersToGroups(groupIds, userIds, settings.numberOfGroupsUserBelongsTo, function(err){
            if( err ){ callback(err); }
            else{ callback(); }
        });
    },

    // create groupings
    function(callback){
        var userGroupMap = grouping.createGroupings(userIds, settings.numberOfGroupings, settings.numberOfGroupingsUserBelongsTo);
// console.log(userGroupMap);
        grouping.voteCycle(userGroupMap, postIds, callback);
    }



    ], callbackIn)
}

grouping.voteCycle = function(userGroupMap, postIds, callbackIn){

    var userIds = _.map(userGroupMap, function(groupingIndexes, userId){ return userId; });

    // foreach post
    async.eachSeries(postIds, function(postId, callback){
        var groupBias = {};
        // shuffle user ids
        userIds = _.shuffle(userIds);

        // foreach user
        async.eachSeries(userIds, function(userId, callbackB){
            // get random group
            var group = _.sample(userGroupMap[userId]);
            var bias;
            var vote;

            // get vote bias
            if( typeof(groupBias[group]) === 'undefined' )
            {                
                groupBias[group] = voteModel.getRandomBias(settings.testBias);
            }
            bias = groupBias[group];
            vote = voteModel.getVoteFromBias(bias);
            userModel.castVote(userId, postId, vote, callbackB);
        }, callback);
    }, callbackIn);
}

grouping.createGroupings = function(userIds, numberOfGroupings, numberOfGroupingsUserBelongsTo){

    var userGroupMap = {};

    // create an empty array for each user
    _.each(userIds, function(userId){ userGroupMap[userId] = []; });

    // creates a 3D array of user ids
    // 1D array = indivdual grouping
    // 2D array = group of groupings
    // 3D array = gouping of groupings
    var allGroupings = _.times(numberOfGroupingsUserBelongsTo, function(){
        return grouping.createGrouping(userIds, numberOfGroupings);
    });

    var mergedGroupings = [];
    allGroupings.forEach(function(grouping){
        grouping.forEach(function(group){
            mergedGroupings.push(group)
        })
    });

// console.log(mergedGroupings.length);

    _.times(mergedGroupings.length, function(index){
        _.each(mergedGroupings[index], function(userId){
            userGroupMap[userId].push(index);
        });
    });
console.log(userGroupMap);
    return userGroupMap;
}

// Takes an array of user ids and the number of groupings.
// Creates an array of arrays with a length equal to the number of groupings,
// shuffles user ids and pushes them into of one of the grouping arrays.
// Returns the 2D array of grouped user ids.
grouping.createGrouping = function(userIdsIn, numberOfGroupings){

    // create an empty array for each grouping
    var groupings = _.map(_.range(numberOfGroupings), function(){ return []; });
    // create a randomized array of user ids
    var userIds = _.shuffle(userIdsIn);

    // add users to groupings
    // push users into grouping
    var count = 0;
    userIds.forEach(function(userId){
        groupings[count].push(userId);
        count++;
        if( count >= numberOfGroupings ){ count = 0; }
    });
    return groupings;

}

// grouping.castUserSeedVotes = function(userIds, numberOfGroupings, postIds, callbackIn){

//     var groupings = [];
//     var count = 0;
//     var i;

//     // create groupings
//     for( i = 0; i < numberOfGroupings; i++){ groupings.push([]); }

//     // add users to groupings
//     count = 0;
//     _.each(userIds, function(userId, index){
//         groupings[count].push(userId);
//         count++;
//         if( count >= numberOfGroupings ){ count = 0; }
//     });

//     async.eachSeries(groupings, function(group, callback){
//         castGroupingVotes(group, postIds, callback);
//     }, callbackIn);

// }


module.exports = grouping;

}());