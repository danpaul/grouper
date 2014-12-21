(function () {

var _ = require('underscore');
var async = require('async');
var assert = require('assert');
var constants = require('../constants.js');
var groupModel = require('../models/group');
var postModel = require('../models/post');
var userModel = require('../models/user');
var voteModel = require('../models/vote');
var voteTest = {};

var settings = {
    numberOfGroups: 10,
    numberOfPosts: 100, // should be at least 10
    numberOfUsers: 4, // should be at least 2
    numberOfBiasTests: 1000,
    testBias: 0.1
}

voteTest.runTest = function(callbackIn){

    var groupIds;
    var userIds;
    var postIds;

    var testVotes1 = 10;

    async.waterfall([
        // validate settings
        function(callback){
            assert((settings.numberOfUsers > 1), 'There must be at least 2 users');
            assert((settings.numberOfGroups > 1), 'There must be at least 2 groups');
            assert((settings.numberOfPosts > 9), 'There must be at least 10 posts');
            callback();
        },
        // create groups
        function(callback){
            groupModel.createSeedGroups(settings.numberOfGroups, callback);
        },
        // confirm groups created
        function(groupIdsIn, callback){
            groupIds = groupIdsIn;
            assert((groupIds.length === settings.numberOfGroups), 'Groups not created.');
            callback();
        },
        // create users
        function(callback){
            userModel.createSeedUsers(settings.numberOfUsers, callback);
        },
        // confirm users created
        function(userIdsIn, callback){
            userIds = userIdsIn;
            assert((userIds.length === settings.numberOfUsers), 'Users not created.');
            callback();
        },
        // create posts
        function(callback){
            postModel.createSeedPosts(settings.numberOfPosts, userIds[0], callback);
        },
        // confirm posts created
        function(postsIdsIn, callback){
            postIds = postsIdsIn;
            assert((postIds.length === settings.numberOfPosts), 'Posts not created.');
            callback();
        },
        // check vote bias function
        function(callback){
            var average;
            var bias;            
            var hasPositiveBias = false;
            var hasNegativeBias = false;
            var i;
            var total = 0.0;

            for( i = 0; i < settings.numberOfBiasTests; i++ ){
                bias = voteModel.getRandomBias(settings.testBias);
                if( bias >= 0.5 ){ hasPositiveBias = true; }
                else{ hasNegativeBias = true; }                
                total += bias;
            }
            average = total / settings.numberOfBiasTests;
            assert(hasPositiveBias, 'No positive bias');
            assert(hasNegativeBias, 'No negative bias');
            assert( ((average > 0.45) && (average < 0.55)), 'Bias average is incorrect');
            callback();
        },        
        // assign users to groups
        function(callback){
            async.eachSeries([userIds[0], userIds[1]], function(userId, callbackB){
                async.eachSeries([groupIds[0], groupIds[1]], function(groupId, callbackC){
                    groupModel.assignUserToGroup(userId, groupId, callbackC);
                }, callbackB);
            }, callback);
        },
        // confirm user are assigned
        function(callback){
            async.eachSeries([userIds[0], userIds[1]], function(userId, callbackB){
                userModel.getGroups(userId, function(err, groupIdsReturned){
                    if( err ){ callbackB(err); }
                    else{
                        assert(groupIdsReturned[0] === groupIds[0]);
                        assert(groupIdsReturned[1] === groupIds[1]);
                        callbackB();
                    }
                });
            }, callback);
        },
        // cast user votes
        function(callback){
            async.eachSeries(_.range(testVotes1), function(number, callbackB){
                userModel.castVote(userIds[0], postIds[number], constants.upvote, callbackB);
            },
            callback);
        }


    ], callbackIn);
}

module.exports = voteTest;

}());