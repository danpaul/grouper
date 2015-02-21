/**
* This module tests basic functionality. Creating users, groups and
* casting votes.
*/

var _ = require('underscore')
var async = require('async')
var assert = require('assert')
var config = require('../config')
var models = require('../models/models')
var seed = require('../lib/seed')

var voteTest = {};


voteTest.runTest = function(settings, callbackIn){

    var groupIds;
    var userIds;
    var postIds;

    function castTestVotes(userId, postIds, vote, callback){
        async.eachSeries(_.range(settings.numberOfTestVotes), function(number, callback){
            models.userVote.vote(userId, null, postIds[number], vote, callback);
        }, callback);
    }

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
            seed.groups(settings.numberOfGroups, callback);
        },
        // confirm groups created
        function(groupIdsIn, callback){
            groupIds = groupIdsIn;
            assert((groupIds.length === settings.numberOfGroups), 'Groups not created.');
            callback();
        },
        // create users
        function(callback){
            seed.users(settings.numberOfUsers, callback)
        },
        // confirm users created
        function(userIdsIn, callback){
            userIds = userIdsIn;
            assert((userIds.length === settings.numberOfUsers), 'Users not created.');
            callback();
        },
        // create posts
        function(callback){
            seed.posts(settings.numberOfPosts, userIds[0], callback);
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
                bias = models.vote.getRandomBias(settings.testBias);
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
        // assign users to test groups[0] and groups[1]
        function(callback){
            var currentGroupIndex = 0;
            async.eachSeries(_.range(settings.numberOfUsers), function(userNumber, callbackB){
                models.user.addGroup(userIds[userNumber], groupIds[currentGroupIndex], function(err){
                    if( err ){ callbackB(err) }
                    else{
                        currentGroupIndex++;
                        if( currentGroupIndex > 1 ){ currentGroupIndex = 0; }
                        callbackB()
                    }
                });
            }, callback);
        },

        // confirm user are assigned
        function(callback){
            // var errorMessage = 'User not assigned to group correctly.';
            models.user.get(userIds[0], function(err, user){
                if( err ){ callback(err); }
                else{
                    assert((user.id === groupIds[0]), 'User not assigned to group correctly.')
                    callback()
                }
            });
        },

        // have user 1 cast 10 upvotes
        function(callback){
            castTestVotes(userIds[0], postIds, config.UPVOTE, callback);
        },
        // check users votes
        function(callback){
            models.userVote.getRecentVotes(userIds[0],
                                           settings.numberOfTestVotes,
                                           function(err, votes){
                if( err ){ callback(err); }
                else{
                    votes.forEach(function(voteObj){
                        assert((voteObj.vote === config.UPVOTE), 'User votes are not correct.');
                    });
                    callback();
                }
            });
        },

        // have user 3 cast 10 upvotes (in same group as as user 1)
        function(callback){
            castTestVotes(userIds[2], postIds, config.UPVOTE, callback);
        },

        // confirm group votes are recorded
        function(callback){
            models.groupVote.getVotes(groupIds[0], function(err, groupVotes){
                if( err ){ callback(err); }
                else{
                    groupVotes.forEach(function(voteObj){
                        assert((voteObj.up === 2), 'Upvotes not correct');
                        assert((voteObj.down === 0), 'Downvotes not correct');
                        assert((voteObj.total === 2), 'Total votes not correct');
                        assert((voteObj.percentage_up === 1.0), 'Percentage up votes not correct');
                    });
                    callback();
                }
            });
        },

        // have user 4 cast 10 upovtes
        function(callback){
            castTestVotes(userIds[3], postIds, config.UPVOTE, callback);
        },
        // have user 5 cast 10 downvotes
        function(callback){
            castTestVotes(userIds[4], postIds, config.DOWNVOTE, callback);
        },
        // confirm user 5 votes went through
        function(callback){
            models.userVote.getRecentVotes(userIds[4],
                                           settings.numberOfTestVotes,
                                           function(err, votes){

                if( err ){ callback(err); }
                else{
                    votes.forEach(function(vote){
                        assert((vote.vote = config.DOWNVOTE), 'Downvotes did not get set');
                    });
                    callback();
                }
            });
        },

        // check group votes
        function(callback){


            models.groupVote.getVotes(groupIds[0], function(err, groupVotes){
                if( err ){ callback(err); }
                else{
                    groupVotes.forEach(function(voteObj){
                        assert((voteObj.up === 2), 'Upvotes not correct');
                        assert((voteObj.down === 1), 'Downvotes not correct');
                        assert((voteObj.total === 3), 'Total votes not correct');
                        assert((voteObj.percentage_up > 0.65 && voteObj.percentage_up < 0.67),
                            'Percentage up votes not correct');
                    });
                    callback();
                }
            });
        },

        // have user 6 cast half upvotes and half downvotes
        function(callback){
            var vote;
            async.eachSeries(_.range(10), function(number, callbackB){
                if( number % 2 === 0 ){ vote = config.UPVOTE; }
                else{ vote = config.DOWNVOTE; }
                models.userVote.vote(userIds[5], null, postIds[number], vote, callbackB);
            }, callback);
        },

        // confirm user 5 has 50% agreement
        function(callback){

            models.userVote.getRecentVotes(userIds[5],
                                           settings.numberOfTestVotes,
                                           function(err, votes){

                if( err ){ callback(err); }
                else{
                    var total = 0;
                    votes.forEach(function(voteObj){
                        total += voteObj.vote
                    });
                    assert((total / 10 == 0.5), 'User vote percentage should be 0.5')
                    callback();
                }
            });
        }
    ], callbackIn);
}

module.exports = voteTest;