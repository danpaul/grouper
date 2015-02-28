(function(){


var groupVoteModel = {}
var async = require('async')
var baseModel = require('./base')
var knex = global.grouper_app.get('GROUPER_KNEX')
var _ = require('underscore')
// var voteModel = require('./vote');

groupVoteModel.getGroupVotes = function(groupId, callbackIn){
    knex('group_votes')
        .select(['post', 'up', 'down', 'total', 'percentage_up'])
        .where({group: groupId})
        .then(function(rows){ callbackIn(null, rows); })
        .catch(callbackIn)
}

// takes an array of groupIds or single id, numberOfPosts
// passes back an array of group_votes for that/those group/groups
groupVoteModel.getRecentOrderedPosts = function(groupIds,
												numberOfPosts,
												callbackIn){
	if( !_.isArray(groupIds) ){ groupIds = [groupIds]; }
	knex('group_votes')
		.select(['post', 'percentage_up', 'total', 'rank'])
		.whereIn('group', groupIds)
		.orderBy('rank', 'desc')
		.limit(numberOfPosts)
		.then(function(groupVotes){ callbackIn(null, groupVotes)})
		.catch(callbackIn)
}

module.exports = groupVoteModel;


}())