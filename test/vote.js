(function () {

var async = require('async');
var assert = require('assert');
var userModel = require('../models/user');
var voteTest = {};

var settings = {
    numberOfUsers: 4
}

voteTest.runTest = function(callbackIn){
    var userIds
    async.waterfall([
        function(callback){
            userModel.createSeedUsers(settings.numberOfUsers, callback);
        },
        function(userIdsIn){
            userIds = userIdsIn;
            assert((userIds.length === settings.numberOfUsers), 'Users not created or returned.');
        }
    ],callbackIn);
}

module.exports = voteTest;

}());