(function () {

var _ = require('underscore');
var async = require('async');
var assert = require('assert');
var constants = require('../constants.js');
var groupModel = require('../models/group');
var groupVoteModel = require('../models/group_vote');
var postModel = require('../models/post');
var userModel = require('../models/user');
var voteModel = require('../models/vote');
var voteTest = {};

var settings = {
    numberOfGroups: 10, // should be at least 10
    numberOfPosts: 100, // should be at least 10
    numberOfUsers: 10, // should be at least 10
    numberOfBiasTests: 1000,
    numberOfTestVotes: 10, // should also be even
    numberOfTestGroups: 4,
    testBias: 0.1
}

voteTest.runTest = function(callbackIn){

    var groupIds;
    var userIds;
    var postIds;

    async.waterfall([
        // validate settings
        function(callback){
            assert((settings.numberOfUsers > 9), 'There must be at least 10 users');
            assert((settings.numberOfGroups > 9), 'There must be at least 10 groups');
            assert((settings.numberOfPosts > 9), 'There must be at least 10 posts');
            assert((settings.numberOfTestVotes === 10), 'There must be exactly 10 test votes');
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
        // assign users to test groups
        function(callback){
            // async.eachSeries([userIds[0], userIds[1]], function(userId, callbackB){
            async.eachSeries(_.range(settings.numberOfUsers), function(userNumber, callbackB){
                async.eachSeries(_.range(settings.numberOfTestGroups), function(number, callbackC){
                    groupModel.assignUserToGroup(userIds[userNumber], groupIds[number], callbackC);
                }, callbackB);
            }, callback);
        },
        // confirm user are assigned
        function(callback){
            var errorMessage = 'User not assigned to group correctly.';
            async.eachSeries([userIds[0], userIds[1]], function(userId, callbackB){
                userModel.getGroups(userId, function(err, groupIdsReturned){
                    if( err ){ callbackB(err); }
                    else{
                        _.each(_.range(settings.numberOfTestGroups), function(number){
                            assert((groupIdsReturned[number] === groupIds[number]), errorMessage);
                        });
                        callbackB();
                    }
                });
            }, callback);
        },
        // have user 1 cast 10 upvotes
        function(callback){
            castTestVotes(userIds[0], postIds, constants.upvote, callback);
        },
        // check users votes
        function(callback){
            userModel.getRecentVotes(userIds[0], settings.numberOfTestVotes, function(err, votes){
                if( err ){ callback(err); }
                else{
                    votes.forEach(function(voteObj){
                        assert((voteObj.vote === constants.upvote), 'User votes are not correct.');
                    });
                    callback();
                }
            });
        },
        // have user 2 cast 10 upvotes
        function(callback){
            castTestVotes(userIds[1], postIds, constants.upvote, callback);
        },
        // confirm group votes are recorded
        function(callback){
            async.eachSeries(_.range(settings.numberOfTestGroups), function(number, callbackB){
                groupVoteModel.getGroupVotes(groupIds[number], function(err, groupVotes){
                    if( err ){ callbackB(err); }
                    else{
                        groupVotes.forEach(function(voteObj){
                            assert((voteObj.up === 2), 'Upvotes not correct');
                            assert((voteObj.down === 0), 'Downvotes not correct');
                            assert((voteObj.total === 2), 'Total votes not correct');
                            assert((voteObj.percentage_up === 1.0), 'Percentage up votes not correct');
                        });
                        callbackB();
                    }
                });
            }, callback)
        },
        // have user 3 cast 10 upovtes
        function(callback){
            castTestVotes(userIds[2], postIds, constants.upvote, callback);
        },
        // have user 4 cast 10 downvotes
        function(callback){
            castTestVotes(userIds[3], postIds, constants.downvote, callback);
        },
        // confirm user 4 votes went through
        function(callback){
            userModel.getRecentVotes(userIds[3], settings.numberOfTestVotes, function(err, votes){
                if( err ){ callback(err); }
                else{
                    votes.forEach(function(vote){
                        assert((vote.vote = constants.downvote ), 'Downvotes did not get set');
                    });
                    callback();
                }
            });
        },
        // check group votes
        function(callback){
            async.eachSeries(_.range(settings.numberOfTestGroups), function(number, callbackB){
                groupVoteModel.getGroupVotes(groupIds[number], function(err, groupVotes){
                    if( err ){ callbackB(err); }
                    else{
                        groupVotes.forEach(function(voteObj){
                            assert((voteObj.percentage_up === 0.75), 'Percentage up votes not correct');
                        });
                        callbackB();
                    }
                });
            }, callback)
        },
        // have user 5 cast half upvotes and half downvotes
        function(callback){
            var vote;
            async.eachSeries(_.range(settings.numberOfTestVotes), function(number, callbackB){
                if( number % 2 === 0 ){ vote = constants.upvote; }
                else{ vote = constants.downvote; }
                userModel.castVote(userIds[4], postIds[number], vote, callbackB);
            }, callback);
        },
        // confirm user 5 has 50% agreement
        function(callback){
            userModel.getRecentVotes(userIds[4], settings.numberOfTestVotes, function(err, votes){
                if( err ){ callback(err); }
                else{
                    votes.forEach(function(vote){
                        assert((vote.percentage_up = 0.5 ), 'User group agreement not correct');
                    });
                    callback();
                }
            });
        }
    ], callbackIn);
}

function castTestVotes(userId, postIds, vote, callback){
    async.eachSeries(_.range(settings.numberOfTestVotes), function(number, callback){
        userModel.castVote(userId, postIds[number], vote, callback);
    }, callback);
}

module.exports = voteTest;

}());