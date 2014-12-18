(function(){


var groupModel = {};
var async = require('async');
var baseModel = require('./base');
var knex = global.grouper_app.get('GROUPER_KNEX');

groupModel.add = function(groupData, callbackIn){
    baseModel.add('groups', {}, callbackIn);
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

module.exports = groupModel;


}())