(function () {

/**
    This file tests the grouping of groups (finds groups that vote simmilarly)
    Database should be empty!
*/


var _ = require('underscore');
var async = require('async');
var assert = require('assert');
// var fs = require('fs');

var constants = require('../constants.js');
var testHelpers = require('./test_helpers.js');

var groupModel = require('../models/group');
var postModel = require('../models/post');
var userModel = require('../models/user');
var voteModel = require('../models/vote');
var groupAgremmentModel = require('../models/group_agreement');

var groupGroupingTest = {};

var settings = {
    // numberOfCycles: 100,
    numberOfUsers: 81,
    numberOfGroups: 9,
    numberOfGroupings: 3,
    numberOfPosts: 20,
    testBias: 0.3
}

groupGroupingTest.runTest = function(callbackIn){

    var seedData;
    var groupings = [];
    var groupUserMap;

    async.waterfall([
        // empty database
        testHelpers.emptyDatabase,
        // create groups, users
        function(callback){
            testHelpers.createGroupsUsers(settings.numberOfGroups, settings.numberOfUsers, function(err, seedDataIn){
                if(err){ callback(err); }
                else{ seedData = seedDataIn; callback(); }
            })
        },
        // create a bunch of random posts
        function(callback){
            postModel.createSeedPosts(settings.numberOfPosts, seedData.users[0], function(err, postIdsIn){
                if( err ){ callback(err); }
                else{
                    seedData.posts = postIdsIn;
                    callback();
                }
            });
        },
        // assign users to groups
        function(callback){
            groupModel.assignUsersToGroups(seedData.groups, seedData.users, 1, callback);
        },

        // get users
        function(callback){
            groupModel.getUsersInGroups(seedData.groups, true, function(err, groupUserMapIn){
                if( err ){ callback(err); }
                else{
                    groupUserMap = groupUserMapIn;
                    callback()
                }
            })

        },

        // create arbitrary groupings
        function(callback){
            _.each(_.range(settings.numberOfGroupings), function(){
                groupings.push([])
            })
            var currentGrouping = 0;
            for( var i = 0; i <  seedData.groups.length; i++ ){
                groupings[currentGrouping].push(seedData.groups[i])
                currentGrouping++;
                if( currentGrouping >= settings.numberOfGroupings ){
                    currentGrouping = 0;
                }
            }
            callback()
        },

        // for each group grouping
        // get all users in those groupings
        function(callback){
            async.eachSeries(groupings, function(grouping, callbackB){
                // each grouping contains an array of group ids
                // get all the users that belong to any of the groups in any of the group ids
                var users = [];
                _.each(grouping, function(groupId){
                    users = users.concat(groupUserMap[groupId.toString()])
                })
                // foreach post
                async.eachSeries(seedData.posts, function(postId, callbackC){
                    var bias = voteModel.getRandomBias(settings.testBias);
                    // foreach user
                    async.eachSeries(users, function(userId, callbackD){
                        // determine vote
                        var vote = voteModel.getVoteFromBias(bias);
                        // cast user vote
                        userModel.castVote(userId, postId, vote, callbackD);
                    }, function(err){
                        if( err ){ callbackC(err); }
                        else{ callbackC(); }
                    })
                },
                function(err){
                    if( err ){ callbackB(err); }
                    else{
                        callbackB()
                    }
                })
            }, callback)
        },

        // perform the actual grouping
        function(callback){
            groupAgremmentModel.groupGroups(callback)
        }

    ], function(err){
        if(err){ callbackIn(err) }
        else{ callbackIn(); }
    })
}


// userModel.castVote(userId, postId, vote, callbackC);


module.exports = groupGroupingTest;

}());