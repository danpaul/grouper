var groupVote = {}

var config = require('../config')
var baseModel = require('./base')
var knex = config.knex

var _ = require('underscore')

var TABLE_NAME = 'group_vote'

/**
* Upserts group vote
*/
groupVote.update = function(groupId, postId, vote, callbackIn){
    var queryObj = baseModel.getMultiKeyVoteQuery( TABLE_NAME,
    											   'post',
    											   postId,
    											   'group',
    											   groupId,
    											   vote);

    knex.raw(queryObj.statement, queryObj.params)
        .then(function(){ callbackIn(); })
        .catch(callbackIn);
}

/**
* Gets group's vote for specific post
* If group vote doesn't exist, passes back null
*/
groupVote.get = function(groupId, postId, callbackIn){

    knex(TABLE_NAME)
        .select(['percentage_up', 'total'])
        .where({group: groupId, post: postId})
        .then(function(rows){
            if( rows.length === 0 ){ callbackIn(null, null) }
            else{
                callbackIn(null, rows[0])
            }
        })
        .catch(callbackIn)
}

/**
* Takes an array of groupIds or single id and numberOfPosts
* Passes back an array of group_votes
*/
groupVote.getRecentOrderedPosts = function(groupIds,
                                           numberOfPosts,
                                           callbackIn){

    // if( !_.isArray(groupIds) ){ groupIds = [groupIds]; }

    // knex(TABLE_NAME)
    //     .select(['post', 'percentage_up', 'total', 'rank'])
    //     .whereIn('group', groupIds)
    //     .orderBy('rank', 'desc')
    //     .limit(numberOfPosts)
    //     .then(function(groupVotes){ callbackIn(null, groupVotes)})
    //     .catch(callbackIn)
}

/**
* Gets all group's votes
*/
groupVote.getVotes = function(groupId, callbackIn){
    knex(TABLE_NAME)
        .select(['post', 'up', 'down', 'total', 'percentage_up'])
        .where({group: groupId})
        .then(function(rows){ callbackIn(null, rows); })
        .catch(callbackIn)
}

groupVote.getGroupPostVotes = function(groupId,
                                       postIds,
                                       minimumGroupVotesToCompare,
                                       callbackIn){

    knex(TABLE_NAME)
        .select(['percentage_up', 'total', 'post'])
        .where('group', groupId)
        .whereIn('post', postIds)
        .then(function(groupVotes){ callbackIn(null, groupVotes); })
        .catch(callbackIn)

}

module.exports = groupVote