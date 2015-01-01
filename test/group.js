(function () {

var _ = require('underscore');
var async = require('async');
var assert = require('assert');

var constants = require('../constants.js');
var testHelpers = require('./test_helpers.js');

var groupModel = require('../models/group');

var groupTest = {};

var settings = {
    numberOfUsers: 9,
    numberOfGroups: 3,
    numberOfGroupings: 3,
    numberOfPosts: 10
}

groupTest.runTest = function(callbackIn){

    var seedData;
    var groupings;

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
            groupModel.assignUsersToGroups(seedData.groups, seedData.users, 1, callback);
        },

        // create groupings
        function(callbackIn){
            groupings = createGroupings(seedData.users, settings.numberOfGroupings);
            console.log(groupings)
        }

        // create posts



    ], callbackIn)
}

// creates groupings in the "oposite" the way groupModel.assignUsersToGroups does
// I.e. [[0, 1, 2], [3, 4, 5]] instead of [[0, 2, 4], [1, 3, 5]]
var createGroupings = function(userIds, numberOfGroupings){
    var groupings = _.range(numberOfGroupings).map(function(){ return []; });
    var groupingCount = _.range(numberOfGroupings).map(function(){ return 0; });

    // determine how many users will be in each grouping (there is prob. a better way to do this)
    var count = 0;
    _.each(userIds, function(){
        groupingCount[count]++;
        if( count === (numberOfGroupings - 1) ){ count = 0; }
        else{ count++; }
    })

    // assign users to groupings
    var groupingIndex = 0;
    var userIndex = 0;
    _.each(groupingCount, function(groupCount){
        // push groupCount many users to grouping
        _.each(_.range(groupCount), function(){
            groupings[groupingIndex].push(userIds[userIndex]);
            userIndex++;
        })
        groupingIndex++;
    })

    return groupings;
}

module.exports = groupTest;

}());