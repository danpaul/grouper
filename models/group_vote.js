(function(){


var groupVoteModel = {};
var async = require('async');
var baseModel = require('./base');
var knex = global.grouper_app.get('GROUPER_KNEX');
// var voteModel = require('./vote');

groupVoteModel.getGroupVotes = function(groupId, callbackIn){
    knex('group_votes')
        .select(['post', 'up', 'down', 'total', 'percentage_up'])
        .where({group: groupId})
        .then(function(rows){ callbackIn(null, rows); })
        .catch(callbackIn)
}



module.exports = groupVoteModel;


}())