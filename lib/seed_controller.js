(function () {
    var seedController = {};
    var knex = global.grouper_app.get('GROUPER_KNEX');
    var helpers = require('../lib/helpers.js');
    var async = require('async');
    var constants = require('./constants');
    var voteController = require('../lib/vote_controller.js');

    var seedSettings = {
        numberOfGroupings: 3,
        voteBias: 0.1,
        numberOfGroupsUserBelongsTo: 2,
        numberOfGroups: 4,
        numberOfPosts: 1000,
        numberOfUsers: 10
    }

    var seed = seedController.seed = function(callbackIn){

        var groupIds;
        var postIds;
        var userIds;

        async.series([

            function(callback){ createGroups(seedSettings.numberOfGroups, callback) },
            function(callback){
                getRecentIds('groups', seedSettings.numberOfGroups, function(err, groupIdsIn){
                    if( err ){ callback(err); }
                    else{ groupIds = groupIdsIn; callback(); }
                });
            },
            function(callback){ createSeedUsers(seedSettings.numberOfUsers, callback); },
            function(callback){
                getRecentIds('users', seedSettings.numberOfUsers, function(err, userIdsIn){
                    if( err ){ callback(err); }
                    else{ userIds = userIdsIn; callback(); }
                });
            },
            function(callback){ createSeedPosts(seedSettings.numberOfPosts, userIds[0], callback) },
            function(callback){
                getRecentIds('posts', seedSettings.numberOfPosts, function(err, postIdsIn){
                    if( err ){ callback(err); }
                    else{ postIds = postIdsIn; callback(); }
                });
            },
            function(callback){
                assignUsersToGroups(groupIds, userIds, seedSettings.numberOfGroupsUserBelongsTo, callback)
            },
            function(callback){
                castUserSeedVotes(userIds, seedSettings.numberOfGroupings, postIds, callback);
            }

        ], callbackIn);
    }


    /********************************************************************************
                SEEDING FUNCTIONS
    ********************************************************************************/


    var createGroups = function(numberOfGroups, callbackIn){
        var groupObjs = Array.apply(null, Array(numberOfGroups)).map(function() { return {} });
        knex('groups').insert(groupObjs)
            .then(function(response){ callbackIn(null); })
            .catch(callbackIn);
    }

    // var createSeedUsers = function(numberOfUsers, callbackIn){

    //     var users = [];

    //     for( var i = 0; i < numberOfUsers; i++ ){
    //         users.push({
    //             email: 'email_' + i.toString() + '@asdf.com',
    //             username: 'user_' + i.toString(),
    //             password: '$2a$08$YgEm3NLhcn5JG36MDovQIuf6Js1jaa4BWGoYRYI5VmcCrMYzEArOi'
    //         });
    //     }

    //     knex('users')
    //         .insert(users)
    //         .then(function(){ callbackIn(); })
    //         .catch(callbackIn)
    // }

    var createSeedPosts = function(numberOfPosts, userId, callbackIn){
        var posts = [];
        for( var i = 0; i < numberOfPosts; i++ ){
            posts.push({
                title: 'post_title_' + i.toString(),
                user: userId,
                url: 'www.foo.com/' + i.toString()
            });
        }
        knex('posts')
            .insert(posts)
            .then(function(){ callbackIn() })
            .catch(callbackIn);

    }

    var getRecentIds = function(table, numberOfIds, callbackIn){
        knex(table)
            .select('id')
            .orderBy('id', 'desc')
            .limit(numberOfIds)
            .then(function(rows){
                callbackIn(null, rows.map(function(row){ return row.id; }));
            })
            .catch(callbackIn)
    }

    // MOVE TO GROUP
    function assignUser(userId, groupId, callbackIn){
        knex.table('groups_users')
            .insert({
                'group': groupId,
                'user': userId
            })
            .then(function(){ callbackIn() })
            .catch(function(err){
                if( err.code === 'ER_DUP_ENTRY' ){ callbackIn(); }
                else{ callbackIn(err); }
            })
    }

    // maybe randomize assignment?
    var assignUsersToGroups = function(groupIds, userIds, numberOfGroupsUserBelongsTo, callbackIn){

        var count;
        var currentGroup = 0;

        async.eachSeries(userIds, function(userId, callback){
            count = 0;
            async.whilst(
                function(){ return count < numberOfGroupsUserBelongsTo },
                function(callback_b){
                    assignUser(userId, groupIds[currentGroup], function(err){
                        if(err){ callback_b(err); }
                        else{
                            count++;
                            currentGroup++;
                            if( currentGroup === groupIds.length ){ currentGroup = 0; }
                            callback_b();
                        }
                    });
                },
                callback
            )
        }, callbackIn)
    }

    var getVoteBias = function(){
        var voteBias = seedSettings.voteBias;
        if( Math.random() >= 0.5 ){
            return voteBias;
        } else {
            return 0 - voteBias;
        }
    }

    var getUserSeedVote = function(bias){
        if( Math.random() + bias >= 0.5 ){
            return constants.upvote;
        } else {
            return constants.downvote;
        }
    }

    var castGroupingVotes = function(userIds, postIds, callbackIn){

        var voteBias;
        var userVote;

        async.eachSeries(postIds, function(postId, callback){
            voteBias = getVoteBias();
            async.eachSeries(userIds, function(userId, callback_b){
                userVote = getUserSeedVote(voteBias);
                voteController.castUserVote(userId, postId, userVote, callback_b);
            }, function(err){
                if(err){ callback(err); }
                else{ callback(); }
            })
        }, callbackIn)
    }

    var castUserSeedVotes = function(userIds, numberOfGroupings, postIds, callbackIn){

        var groupings = [];
        var count;
        var i;

        // create groupings
        for( i = 0; i < numberOfGroupings; i++){ groupings.push([]); }

        // add users to groupings
        count = 0;
        userIds.forEach(function(userId){
            groupings[count].push(userId);
            count++;
            if( count >= numberOfGroupings ){ count = 0; }
        });

        async.eachSeries(groupings, function(group, callback){
            castGroupingVotes(group, postIds, callback);
        }, callbackIn);

    }


    module.exports = seedController;
}());