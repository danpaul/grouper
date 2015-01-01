(function () {

var _ = require('underscore');
var async = require('async');
var assert = require('assert');
var constants = require('../constants.js');
var testHelpers = require('./test_helpers.js');

var groupTest = {};

var settings = {
    numberOfUsers: 9,
    numberOfGroups: 3,
    numberOfPosts: 10
}

groupTest.runTest = function(callbackIn){

    var seedData;

    async.waterfall([

        // create groups, users, posts
        function(callback){
            testHelpers.createGroupsUsersPosts(settings.numberOfGroups, settings.numberOfUsers, settings.numberOfPosts, function(err, seedDataIn){
                if(err){ callback(err); }
                else{ seedData = seedDataIn; callback(); }
            })
        },

        // assign users to groups
        function(callback){

            
        }


        // create users

        // create posts



    ], callbackIn)
}



module.exports = groupTest;

}());