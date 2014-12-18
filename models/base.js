(function(){


var baseModel = {};
var async = require('async');
var knex = global.grouper_app.get('GROUPER_KNEX');

baseModel.add = function(tableName, dataIn, callbackIn){
    knex(tableName)
        .insert(dataIn)
        .then(function(rows){ callbackIn(null, rows[0]); })
        .catch(callbackIn);
}

module.exports = baseModel;


}())