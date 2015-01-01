(function () {

/**
    Note: Grouping test should occur on an empty DB
*/

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
    numberOfGroups: 10, // should be at least 10
    numberOfGroupsUserBelongsTo: 3,
    numberOfPosts: 1000, // should be at least 10
    numberOfUsers: 100, // should be at least 10
    numberOfGroupings: 10,
    numberOfGroupingsUserBelongsTo: 3,  
    testBias: 0.4,
    numberOfCycles: 100,
    displayIndividualAverages: false
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

    // assign users to groups
    function(callback){
        groupModel.assignUsersToGroups(groupIds, userIds, settings.numberOfGroupsUserBelongsTo, function(err){
            if( err ){ callback(err); }
            else{ callback(); }
        });
    },

    // cycle votings and groupings
    function(callback){
        console.log('start cycling')
        grouping.voteGroupCycle(userIds, groupIds, callback);
    }

    ], callbackIn)
}

grouping.voteGroupCycle = function(userIds, groupIds, callbackIn){

    // create groupings
    var userGroupMap = grouping.createGroupings(userIds, settings.numberOfGroupings, settings.numberOfGroupingsUserBelongsTo);

    // foreach cycle
    async.eachSeries(_.range(settings.numberOfCycles), function(number, callback){
        var postIds = [];

        async.waterfall([

            // create new posts
            function(callbackB){
                postModel.createSeedPosts(settings.numberOfPosts, userIds[0], function(err, postIdsIn){
                    if( err ){ callbackB(err); }
                    else{ postIds = postIdsIn; callbackB(); }
                });
            },

            // have all users vote
            function(callbackB){
                grouping.voteCycle(userGroupMap, postIds, callbackB);
            },

            // group users based on their votes
            function(callbackB){
                groupModel.groupUsers(groupIds, callbackB);
            },
            
            // display grouping statistics
            function(callbackB){
                grouping.displayGroupStatistics(userIds, userGroupMap, groupIds, callbackB);
            }

        ], callback)
    }, callbackIn)
}

grouping.displayGroupStatistics = function(userIds, userGroupMap, groupIds, callbackIn){

    var indivdualAverages = [];

    // foreach user, get groups user belongs to
    async.eachSeries(userIds, function(userId, callback){

        // foreach group, if user belongs, userBelongs get increment
        userModel.getGroups(userId, function(err, groupsUserBelongsTo){
            if( err ){ callback(err); }
            else{
                // get the groups in the user's groupings
                var usersGroupings = userGroupMap[userId].map(function(groupIndex){ return groupIds[groupIndex]; });
                var matchedGroups = 0;

                // groupseUserBelongs
                groupsUserBelongsTo.forEach(function(userGroup){
                    if( _.contains(usersGroupings, userGroup) ){ matchedGroups += 1; }
                })
                var userAverage = matchedGroups / groupsUserBelongsTo.length;                

                if( settings.displayIndividualAverages ){
                    console.log('User ' + userId + ' averages: ' + userAverage );
                }
                indivdualAverages.push(userAverage);
            }
            callback();
        })
    }, function(err){
        if( err ){ callbackIn(err); }
        else{
            var total = 0;
            indivdualAverages.forEach(function(avg){ total += avg; });
            var average = total / indivdualAverages.length;
            console.log('Total average: ' +  average);
            callbackIn();
        }
    });
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