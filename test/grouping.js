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


var settings = {
    numberOfGroups: 100, // should be at least 10
    numberOfPosts: 10000, // should be at least 10
    numberOfUsers: 1000, // should be at least 10
    numberOfGroupings: 10,
    numberOfGroupsUserBelongsTo: 20,
    numberOfGroupingsUserBelongsTo: 3,
    // numberOfBiasTests: 1000,
    // numberOfTestVotes: 10, // should also be even
    // numberOfTestGroups: 4,
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
        var groupingsObject = grouping.createGroupings(userIds, settings.numberOfGroupings, settings.numberOfGroupingsUserBelongsTo);
// console.log(groupingsObject)
// TODO: users are tending to agree a lot, (non below 50%)
// TODO: revise groupingObject, don't need groupings returned
// TODO: cycle through grouping/voteCycle
        grouping.voteCycle(groupingsObject, postIds, callback);

        // callback();
    }



    ], callbackIn)

    // callbackIn();
}

grouping.voteCycle = function(groupingObject, postIds, callbackIn){

    var userGroupMap = groupingObject.userGroupMap;
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
    var allGroupings;
    var i;
    var mergedGroupings = [];
    var shuffledUsers;
    var userGroupMap = {};

    _.each(userIds, function(userId){ userGroupMap[userId] = []; });
    
    allGroupings = _.times(numberOfGroupingsUserBelongsTo, function(){
        return grouping.createGrouping(userIds, numberOfGroupings);
    });

    allGroupings.forEach(function(grouping){
        grouping.forEach(function(group){
            mergedGroupings.push(group)
        })
    });

    _.times(mergedGroupings.length, function(index){
        _.each(mergedGroupings[index], function(userId){
            userGroupMap[userId].push(index);
        });
    });

    return {
        'userGroupMap': userGroupMap,
        'groupings': mergedGroupings
    }
}

grouping.createGrouping = function(userIdsIn, numberOfGroupings){

    var groupings = _.map(_.range(numberOfGroupings), function(){ return []; });
    var count = 0;
    var userIds = _.shuffle(userIdsIn);

    // add users to groupings
    userIds.forEach(function(userId){
        groupings[count].push(userId);
        count++;
        if( count >= numberOfGroupings ){ count = 0; }
    });

    return groupings;

}

grouping.castUserSeedVotes = function(userIds, numberOfGroupings, postIds, callbackIn){

    var groupings = [];
    var count = 0;
    var i;

    // create groupings
    for( i = 0; i < numberOfGroupings; i++){ groupings.push([]); }

    // add users to groupings
    count = 0;
    _.each(userIds, function(userId, index){
        groupings[count].push(userId);
        count++;
        if( count >= numberOfGroupings ){ count = 0; }
    });

    async.eachSeries(groupings, function(group, callback){
        castGroupingVotes(group, postIds, callback);
    }, callbackIn);

}


module.exports = grouping;

}());