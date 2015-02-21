var groupVote = {}

var config = require('../config')
var baseModel = require('./base')

var knex = config.knex

var TABLE_NAME = 'group_vote'


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

module.exports = groupVote