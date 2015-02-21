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
console.log('asdf')
return
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

// function castTestVotes(userId, postIds, vote, callback){
//     async.eachSeries(_.range(settings.vote.numberOfTestVotes), function(number, callback){
//         models.userVote.vote(userId, postIds[number], vote, callback);
//         // userModel.castVote(userId, postIds[number], vote, callback);
//     }, callback);
// }

module.exports = voteTest;