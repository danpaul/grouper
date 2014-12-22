(function(){


var groupModel = {};
var async = require('async');
var baseModel = require('./base');
var knex = global.grouper_app.get('GROUPER_KNEX');
var voteModel = require('./vote');

groupModel.add = function(groupData, callbackIn){
    baseModel.add('groups', {}, callbackIn);
}

groupModel.assignUserToGroup = function(userId, groupId, callbackIn){

    knex('groups_users')
        .insert({ user: userId, group: groupId })
        .then(function(rows){ callbackIn(null, rows[0]); })
        .catch(callbackIn)
        // if( err.code === 'ER_DUP_ENTRY' ){ callback(); }
}

groupModel.assignUsersToGroups = function(groupIds, userIds, numberOfGroupsUserBelongsTo, callbackIn){
    var count;
    var currentGroup = 0;

    async.eachSeries(userIds, function(userId, callback){
        count = 0;
        async.whilst(
            function(){ return count < numberOfGroupsUserBelongsTo },
            function(callbackB){
                groupModel.assignUserToGroup(userId, groupIds[currentGroup], function(err){
                    if(err){ callbackB(err); }
                    else{
                        count++;
                        currentGroup++;
                        if( currentGroup === groupIds.length ){ currentGroup = 0; }
                        callbackB();
                    }
                });
            },
            callback
        )
    }, callbackIn)
}

groupModel.createSeedGroups = function(numberOfGroups, callbackIn){

    var groups = [];
    var groupIds = [];

    for( var i = 0; i < numberOfGroups; i++ ){ groups.push({}); }

    async.eachSeries(groups, function(group, callback){
        groupModel.add(group, function(err, groupId){
            if(err){ callback(err); }
            else{
                groupIds.push(groupId)
                callback();
            }
        })
    }, function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(null, groupIds); }
    })
}

groupModel.updateGroupVote = function(groupId, postId, vote, callbackIn){
    var queryObj = voteModel.getMultiKeyVoteQuery( 'group_votes', 'post', postId, 'group', groupId, vote);
    knex.raw(queryObj.statement, queryObj.params)
        .then(function(){ callbackIn(); })
        .catch(callbackIn);
}

groupModel.updateUserGroupAgreements = function(groupId, userId, postId, vote, callbackIn){
    // retrieve group votes
    knex('group_votes')
        .select(['percentage_up', 'total'])
        .where({post: postId, group: groupId})
        .then(function(groupVoteIn){
            var groupVote = groupVoteIn[0];
            //determine agreement
            var userAgreementVote =
                voteModel.getUserAgreementVote( vote, groupVote.percentage_up, groupVote.total);
            // if not enough votes or tie, do nothing
            if( userAgreementVote === null ){ callbackIn(); }
            // update user_group_agreement
            else {
                var updateObj = voteModel.getMultiKeyVoteQuery( 'user_group_agreements', 'user', userId, 'group', groupId, userAgreementVote);
                knex.raw(updateObj.statement, updateObj.params)
                    .then(function(){ callbackIn(); })
                    .catch(callbackIn)

            }
        })
        .catch(callbackIn)
}

groupModel.updateUsersGroupVotes = function(userId, postId, vote, callbackIn){

    var getGroups = require('./user').getGroups;

    async.waterfall([
        // get groups user belongs to
        function(callback){
            getGroups(userId, callback);
        },
        // update group votes
        function(groupIds, callback){
            async.eachSeries(groupIds, function(groupId, callbackB){
                groupModel.updateGroupVote(groupId, postId, vote, function(err){
                    if(err){ callbackB(err); }
                    else{
                        // update user group agreements
                        groupModel.updateUserGroupAgreements(groupId, userId, postId, vote, callbackB)
                    }
                });
            }, callback);
        }
    ], callbackIn);
}

module.exports = groupModel;


}())