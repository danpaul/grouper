var groupGroup = {}

var config = require('../config')
var async = require('async')
var seed = require('../lib/seed')
var models = require('../models/models')
var _ = require('underscore')


groupGroup.runTest = function(settings, callbackIn){

	var groupIds
	var postIds
	var userIds

	var groupUserMap
	var groupings = []

    async.waterfall([

        // seed groups
        function(callback){
        	seed.groups(settings.numberOfGroups, callback)
        },

        // seed users
        function(groupIdsIn, callback){
        	groupIds = groupIdsIn
        	seed.users(settings.numberOfUsers, callback)
        },

        // seed posts
        function(userIdsIn, callback){
        	userIds = userIdsIn
        	seed.posts(settings.numberOfPosts, userIds[0], callback)
        },

        // assign users to groups
        function(postIdsIn, callback){
        	postIds = postIdsIn
        	seed.assignUsersToGroups(groupIds, userIds, callback);
        },

        // get map of user group ids to user ids
        function(callback){
        	models.user.getUsersInGroups(groupIds, true, callback)
        },

        // create arbitrary groupings
        function(groupUserMapIn, callback){
        	groupUserMap = groupUserMapIn

            _.each(_.range(settings.numberOfGroupings), function(){
                groupings.push([])
            })
// console.log(groupings[0])
            var currentGrouping = 0;
            for( var i = 0; i <  groupIds.length; i++ ){
                groupings[currentGrouping].push(groupIds[i])
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
console.log(1)
            async.eachSeries(groupings, function(grouping, callbackB){
                // each grouping contains an array of group ids
                // get all the users that belong to any of the groups in any of the group ids
                var users = [];
                _.each(grouping, function(groupId){
                    users = users.concat(groupUserMap[groupId.toString()])
                })
                // foreach post
                async.eachSeries(postIds, function(postId, callbackC){
                    var bias = models.vote.getRandomBias(settings.testBias);
                    // foreach user
                    async.eachSeries(users, function(userId, callbackD){
                        // determine vote
                        var vote = models.vote.getVoteFromBias(bias);
                        // cast user vote
                        models.userVote.vote(userId, null, postId, vote, callbackD)
                        // userModel.castVote(userId, postId, vote, callbackD);
                    }, function(err){
                        if( err ){ callbackC(err); }
                        else{ callbackC(); }
                    })
                },
                function(err){
console.log(3)
                    if( err ){ callbackB(err); }
                    else{
                        callbackB()
                    }
                })
            }, callback)
        },

        // perform the actual grouping
        function(callback){
// console.log()
console.log('asdf')
            models.groupAgreement.group(callback)
        },

        // // check groupings
        // function(callback){
        //     async.eachSeries(groupings, function(grouping, callbackB){

        //         // get agreeing groups
        //         groupAgreementModel.getAgreeingGroups(grouping[0],
        //                                               2,
        //                                               function(err, groupAgreements){
        //             if(err){ callbackB(err); }
        //             else{
        //                 _.each(groupAgreements, function(agreement){
        //                     assert(_.contains(grouping, agreement.group))
        //                 })
        //                 callbackB()                        
        //             }
        //         })
        //     }, callback)
        // }
    ], function(err){
        if(err){ callbackIn(err) }
        else{ callbackIn(); }
    })
}

module.exports = groupGroup






// (function () {

// /**
//     This file tests the grouping of groups (finds groups that vote simmilarly)
//     Database should be empty!
// */


// var _ = require('underscore');
// var async = require('async');
// var assert = require('assert');
// // var fs = require('fs');

// var constants = require('../constants.js');
// var testHelpers = require('./test_helpers.js');

// var groupModel = require('../models/group');
// var postModel = require('../models/post');
// var userModel = require('../models/user');
// var voteModel = require('../models/vote');
// var groupAgreementModel = require('../models/group_agreement');

// var groupGroupingTest = {};

// var settings = {
//     // numberOfCycles: 100,
//     numberOfUsers: 81,
//     numberOfGroups: 9,
//     numberOfGroupings: 3,
//     numberOfPosts: 20,
//     testBias: 0.3
// }

// groupGroupingTest.runTest = function(callbackIn){

//     var seedData;
//     var groupings = [];
//     var groupUserMap;

//     async.waterfall([
//         // empty database
//         testHelpers.emptyDatabase,
//         // create groups, users
//         function(callback){
//             testHelpers.createGroupsUsers(settings.numberOfGroups, settings.numberOfUsers, function(err, seedDataIn){
//                 if(err){ callback(err); }
//                 else{ seedData = seedDataIn; callback(); }
//             })
//         },
//         // create a bunch of random posts
//         function(callback){
//             postModel.createSeedPosts(settings.numberOfPosts, seedData.users[0], function(err, postIdsIn){
//                 if( err ){ callback(err); }
//                 else{
//                     seedData.posts = postIdsIn;
//                     callback();
//                 }
//             });
//         },
//         // assign users to groups
//         function(callback){
//             groupModel.assignUsersToGroups(seedData.groups, seedData.users, 1, callback);
//         },

//         // get users
//         function(callback){
//             groupModel.getUsersInGroups(seedData.groups, true, function(err, groupUserMapIn){
//                 if( err ){ callback(err); }
//                 else{
//                     groupUserMap = groupUserMapIn;
//                     callback()
//                 }
//             })

//         },

//         // create arbitrary groupings
//         function(callback){
//             _.each(_.range(settings.numberOfGroupings), function(){
//                 groupings.push([])
//             })
//             var currentGrouping = 0;
//             for( var i = 0; i <  seedData.groups.length; i++ ){
//                 groupings[currentGrouping].push(seedData.groups[i])
//                 currentGrouping++;
//                 if( currentGrouping >= settings.numberOfGroupings ){
//                     currentGrouping = 0;
//                 }
//             }
//             callback()
//         },

//         // for each group grouping
//         // get all users in those groupings
//         function(callback){
//             async.eachSeries(groupings, function(grouping, callbackB){
//                 // each grouping contains an array of group ids
//                 // get all the users that belong to any of the groups in any of the group ids
//                 var users = [];
//                 _.each(grouping, function(groupId){
//                     users = users.concat(groupUserMap[groupId.toString()])
//                 })
//                 // foreach post
//                 async.eachSeries(seedData.posts, function(postId, callbackC){
//                     var bias = voteModel.getRandomBias(settings.testBias);
//                     // foreach user
//                     async.eachSeries(users, function(userId, callbackD){
//                         // determine vote
//                         var vote = voteModel.getVoteFromBias(bias);
//                         // cast user vote
//                         userModel.castVote(userId, postId, vote, callbackD);
//                     }, function(err){
//                         if( err ){ callbackC(err); }
//                         else{ callbackC(); }
//                     })
//                 },
//                 function(err){
//                     if( err ){ callbackB(err); }
//                     else{
//                         callbackB()
//                     }
//                 })
//             }, callback)
//         },

//         // perform the actual grouping
//         function(callback){
//             groupAgreementModel.groupGroups(callback)
//         },

//         // check groupings
//         function(callback){
//             async.eachSeries(groupings, function(grouping, callbackB){

//                 // get agreeing groups
//                 groupAgreementModel.getAgreeingGroups(grouping[0],
//                                                       2,
//                                                       function(err, groupAgreements){
//                     if(err){ callbackB(err); }
//                     else{
//                         _.each(groupAgreements, function(agreement){
//                             assert(_.contains(grouping, agreement.group))
//                         })
//                         callbackB()                        
//                     }
//                 })
//             }, callback)
//         }
//     ], function(err){
//         if(err){ callbackIn(err) }
//         else{ callbackIn(); }
//     })
// }


// // userModel.castVote(userId, postId, vote, callbackC);


// module.exports = groupGroupingTest;

// }());