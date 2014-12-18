(function () {

var async = require('async');
var assert = require('assert');
var groupModel = require('../models/group');
var postModel = require('../models/post');
var userModel = require('../models/user');
var voteTest = {};

var settings = {
    numberOfGroups: 10,
    numberOfPosts: 100,
    numberOfUsers: 4
}

voteTest.runTest = function(callbackIn){

    var groupIds;
    var userIds;
    var postIds;

    async.waterfall([
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
        }
    ], callbackIn);
}

module.exports = voteTest;

}());