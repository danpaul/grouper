var groupVote = {}

var config = require('../config')
var baseModel = require('./base')

var knex = config.knex

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
* Gets all goup votes
*/
groupVote.getVotes = function(groupId, callbackIn){
    knex(TABLE_NAME)
        .select(['post', 'up', 'down', 'total', 'percentage_up'])
        .where({group: groupId})
        .then(function(rows){ callbackIn(null, rows); })
        .catch(callbackIn)
}

module.exports = groupVote