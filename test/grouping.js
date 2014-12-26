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
    numberOfGroups: 4, // should be at least 10
    numberOfGroupsUserBelongsTo: 2,
    numberOfPosts: 10, // should be at least 10
    numberOfUsers: 10, // should be at least 10
    numberOfGroupings: 4,
    numberOfGroupingsUserBelongsTo: 2,
    testBias: 0.1,
    numberOfCycles: 4
}

grouping.runTest = function(callbackIn){
    var goupIds;
    var userIds;    
    var postIds;
    var userGroupMap

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
        userGroupMap = grouping.createGroupings(userIds, settings.numberOfGroupings, settings.numberOfGroupingsUserBelongsTo);
        callback();
        // grouping.voteCycle(userGroupMap, postIds, callback);
    },

    // cycle votings and groupings
    function(callback){
        async.eachSeries(_.range(settings.numberOfCycles), function(cycleNumber, callbackB){
            grouping.voteCycle(userGroupMap, postIds, function(err){
                if( err ){ callbackB(err); }
                else{
                    groupModel.groupUsers(groupIds, callbackB);
                }
            });
        }, callback);
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

            // get random grouping user belongs to
            var group = _.sample(userGroupMap[userId]);
            // get vote bias
            if( typeof(groupBias[group]) === 'undefined' )
            {                
                groupBias[group] = voteModel.getRandomBias(settings.testBias);
            }
            var bias = groupBias[group];
            var vote = voteModel.getVoteFromBias(bias);
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

    // for each grouping of groupings,
    // add the grouping number to the user array
    allGroupings.forEach(function(groupings){
        for( var i = 0; i < groupings.length; i++ ){
            groupings[i].forEach(function(userId){
                userGroupMap[userId].push(i);
            })
        }
    });

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

module.exports = grouping;

}());