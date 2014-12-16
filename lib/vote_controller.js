(function () {

    var knex = global.grouper_app.get('GROUPER_KNEX');
    var voteController = {}

    // var models = require('../models.js').models();

    var helpers = require('../lib/helpers.js');
    var async = require('async');

    var constants = require('./constants');

    /********************************************************************************
                VOTE FUNCTIONS
    ********************************************************************************/


    voteController.getMultiKeyVoteQuery = function(
                                            table,
                                            columnOne,
                                            valueOne,
                                            columnTwo,
                                            valueTwo,
                                            vote){
        var params = [table, columnOne, columnTwo, valueOne, valueTwo];

        if( vote === constants.upvote ){
            return {statement: constants.sql.upsert_multi_key_upvote, 'params': params }
        } else {
            return {statement: constants.sql.upsert_multi_key_downvote, 'params': params }
        }
    }


    voteController.updateVote = function(table, id, vote, callbackIn){

        var params = [table, id];
        var statement = 'UPDATE ?? SET total = total + 1, '

        if( vote === constants.upvote ){
            statement += 'up = up + 1, ' +
                         'percentage_up = up / total ';
        } else {
            statement += 'down = down + 1, ' +
                         'percentage_up = up / total ';
        }

        statement += 'WHERE id=?; ';

        knex.raw(statement, params)
            .then(function(){ callbackIn() })
            .catch(callbackIn)
    }

    var updateGroupVotes = voteController.updateGroupVotes = function(
                                                                userId,
                                                                postId,
                                                                vote,
                                                                callbackIn){
        knex('groups_users')
            .where({user: userId})
            .select('group')
            .then(function(groupRows){
                var groupIds = [];
                groupRows.forEach(function(r){ groupIds.push(r.group) });
                async.eachSeries(groupIds, function(groupId, callback){

                    var queryObj = voteController.getMultiKeyVoteQuery(
                                                    'post_group_votes',
                                                    'post',
                                                    postId,
                                                    'group',
                                                    groupId,
                                                    vote);
                    // upsert group vote
                    knex.raw(queryObj.statement, queryObj.params)
                        .then(function(){
                            // get post_group_vote that was just updated/inserted
                            knex('post_group_votes')
                                .select(['percentage_up', 'total'])
                                .where({post: postId, group: groupId})
                                .then(function(groupVote){
                                    groupVote = groupVote[0];
                                    //determine agreement
                                    var userAgreementVote = helpers.getUserAgreementVote(
                                                                                vote,
                                                                                groupVote.percentage_up,
                                                                                groupVote.total);

                                    // if not enough votes or tie, do nothing
                                    if( userAgreementVote === null ){
                                        callback();
                                    // update user_group_agreement
                                    } else {
                                        var updateObj = voteController.getMultiKeyVoteQuery(
                                                                                'user_group_agreements',
                                                                                'user',
                                                                                userId,
                                                                                'group',
                                                                                groupId,
                                                                                userAgreementVote);
                                        knex.raw(updateObj.statement, updateObj.params)
                                            .then(function(){ callback() })
                                            .catch(callback)

                                    }
                                })
                                .catch(callback)

                            // update user_group_agreement
                            // callback();
                        })
                        .catch(callback);
                }, callbackIn);

            })
            .catch(callbackIn)

    }

    // Takes user and post models, does all vote updating magic then calls callback
    var castUserVote =  voteController.castUserVote = function(
                                                        userId,
                                                        postId,
                                                        vote,
                                                        callbackIn){
        knex('user_votes')
            .select('user')
            .where({user: userId, post: postId})
            .then(function(rows){
                if( rows.length !== 0 ){ callbackIn(); }
                else{
                    knex('user_votes')
                        .insert({
                            'user': userId,
                            'post': postId,
                            'vote': vote
                        })
                        .then(function(userVoteId){
                            voteController.updateVote('posts', postId, vote, function(err){
                                if( err ){ callbackIn(err); }
                                else{
                                    updateGroupVotes(userId, postId, vote, callbackIn);
                                }
                            });
                        })
                        .catch(function(err){ callbackIn(err); })
                }
            })
    }


    /********************************************************************************
                SEEDING FUNCTIONS
    ********************************************************************************/


    // var createGroups = function(numberOfGroups, callbackIn){
    //     var groupObjs = Array.apply(null, Array(numberOfGroups)).map(function() { return {} });
    //     knex('groups').insert(groupObjs)
    //         .then(function(response){ callbackIn(null); })
    //         .catch(callbackIn);
    // }

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

    // var createSeedPosts = function(numberOfPosts, userId, callbackIn){
    //     var posts = [];
    //     for( var i = 0; i < numberOfPosts; i++ ){
    //         posts.push({
    //             title: 'post_title_' + i.toString(),
    //             user: userId,
    //             url: 'www.foo.com/' + i.toString()
    //         });
    //     }
    //     knex('posts')
    //         .insert(posts)
    //         .then(function(){ callbackIn() })
    //         .catch(callbackIn);

    // }

    // var getRecentIds = function(table, numberOfIds, callbackIn){
    //     knex(table)
    //         .select('id')
    //         .orderBy('id', 'desc')
    //         .limit(numberOfIds)
    //         .then(function(rows){
    //             callbackIn(null, rows.map(function(row){ return row.id; }));
    //         })
    //         .catch(callbackIn)
    // }

    // // MOVE TO GROUP
    // function assignUser(userId, groupId, callbackIn){
    //     knex.table('groups_users')
    //         .insert({
    //             'group': groupId,
    //             'user': userId
    //         })
    //         .then(function(){ callbackIn() })
    //         .catch(function(err){
    //             if( err.code === 'ER_DUP_ENTRY' ){ callbackIn(); }
    //             else{ callbackIn(err); }
    //         })
    // }

    // // maybe randomize assignment?
    // var assignUsersToGroups = function(groupIds, userIds, numberOfGroupsUserBelongsTo, callbackIn){

    //     var count;
    //     var currentGroup = 0;

    //     async.eachSeries(userIds, function(userId, callback){
    //         count = 0;
    //         async.whilst(
    //             function(){ return count < numberOfGroupsUserBelongsTo },
    //             function(callback_b){
    //                 assignUser(userId, groupIds[currentGroup], function(err){
    //                     if(err){ callback_b(err); }
    //                     else{
    //                         count++;
    //                         currentGroup++;
    //                         if( currentGroup === groupIds.length ){ currentGroup = 0; }
    //                         callback_b();
    //                     }
    //                 });
    //             },
    //             callback
    //         )
    //     }, callbackIn)
    // }

    // var getVoteBias = function(){
    //     var voteBias = seedSettings.voteBias;
    //     if( Math.random() >= 0.5 ){
    //         return voteBias;
    //     } else {
    //         return 0 - voteBias;
    //     }
    // }

    // var getUserSeedVote = function(bias){
    //     if( Math.random() + bias >= 0.5 ){
    //         return constants.upvote;
    //     } else {
    //         return constants.downvote;
    //     }
    // }

    // var castGroupingVotes = function(userIds, postIds, callbackIn){

    //     var voteBias;
    //     var userVote;

    //     async.eachSeries(postIds, function(postId, callback){
    //         voteBias = getVoteBias();
    //         async.eachSeries(userIds, function(userId, callback_b){
    //             userVote = getUserSeedVote(voteBias);
    //             voteController.castUserVote(userId, postId, userVote, callback_b);
    //         }, function(err){
    //             if(err){ callback(err); }
    //             else{ callback(); }
    //         })
    //     }, callbackIn)
    // }

    // var castUserSeedVotes = function(userIds, numberOfGroupings, postIds, callbackIn){

    //     var groupings = [];
    //     var count;
    //     var i;

    //     // create groupings
    //     for( i = 0; i < numberOfGroupings; i++){ groupings.push([]); }

    //     // add users to groupings
    //     count = 0;
    //     userIds.forEach(function(userId){
    //         groupings[count].push(userId);
    //         count++;
    //         if( count >= numberOfGroupings ){ count = 0; }
    //     });

    //     async.eachSeries(groupings, function(group, callback){
    //         castGroupingVotes(group, postIds, callback);
    //     }, callbackIn);

    // }

    // /********************************************************************************
    //                 TESTING / SEEDING
    // ********************************************************************************/


    // var seedSettings = {
    //     numberOfGroupings: 3,
    //     voteBias: 0.1,
    //     numberOfGroupsUserBelongsTo: 2,
    //     numberOfGroups: 4,
    //     numberOfPosts: 10
    // }


    // var seed = voteController.seed = function(callbackIn){

    //     var groupIds;
    //     var postIds;
    //     var userIds;

    //     async.series([

    //         function(callback){ createGroups(seedSettings.numberOfGroups, callback) },
    //         function(callback){
    //             getRecentIds('groups', seedSettings.numberOfGroups, function(err, groupIdsIn){
    //                 if( err ){ callback(err); }
    //                 else{ groupIds = groupIdsIn; callback(); }
    //             });
    //         },
    //         function(callback){ createSeedUsers(seedSettings.numberOfUsers, callback); },
    //         function(callback){
    //             getRecentIds('users', seedSettings.numberOfUsers, function(err, userIdsIn){
    //                 if( err ){ callback(err); }
    //                 else{ userIds = userIdsIn; callback(); }
    //             });
    //         },
    //         function(callback){ createSeedPosts(seedSettings.numberOfPosts, userIds[0], callback) },
    //         function(callback){
    //             getRecentIds('posts', seedSettings.numberOfPosts, function(err, postIdsIn){
    //                 if( err ){ callback(err); }
    //                 else{ postIds = postIdsIn; callback(); }
    //             });
    //         },
    //         function(callback){
    //             assignUsersToGroups(groupIds, userIds, seedSettings.numberOfGroupsUserBelongsTo, callback)
    //         },
    //         function(callback){
    //             castUserSeedVotes(userIds, seedSettings.numberOfGroupings, postIds, callback);
    //         }

    //     ], callbackIn);
    // }




    module.exports = voteController;

}());