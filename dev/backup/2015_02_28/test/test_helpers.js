(function () {

var _ = require('underscore');
var async = require('async');
var knex = global.grouper_app.get('GROUPER_KNEX');

var constants = require('../constants')

var groupModel = require('../models/group');
var postModel = require('../models/post');
var userModel = require('../models/user');

var testHelpers = {};

testHelpers.createGroupsUsers = function(numGroups, numUsers, callbackIn){
    var returnObj = {};

    async.waterfall([

        // create groups
        function(callback){
            groupModel.createSeedGroups(numGroups, function(err, groupIdsIn){
                if( err ){ callback(err); }
                else{ returnObj.groups = groupIdsIn; callback(); }
            });
        },

        // create users
        function(callback){
            userModel.createSeedUsers(numUsers, function(err, userIdsIn){
                if( err ){ callback(err); }
                else{ returnObj.users = userIdsIn; callback(); }
            });
        },

        // create posts
        // function(callback){
        //     postModel.createSeedPosts(numPosts, returnObj['users'][0], function(err, postIdsIn){
        //         if( err ){ callback(err); }
        //         else{ returnObj.posts = postIdsIn; callback(); }
        //     });
        // },
  
    ], function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(null, returnObj); }
    });

}

testHelpers.emptyDatabase = function(callbackIn){
    async.each(constants.databaseTables, testHelpers.clearTable, callbackIn);
}

testHelpers.clearTable = function(table, callbackIn){
        knex(table)
            .truncate()
            .then(function(){ callbackIn(); })
            .catch(callbackIn)
}

module.exports = testHelpers;

}());