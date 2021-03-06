/** 
* TESTING EMPTYS THE DB!!!
* This is the main driver for tests.
*/

var async = require('async')
var config = require('../config')
var settings = require('./settings')

var knex = config.knex

var clearTable = function(table, callbackIn){
        knex(table)
            .truncate()
            .then(function(){ callbackIn(); })
            .catch(callbackIn)
}

var emptyDatabase = function(callbackIn){
    async.eachSeries(config.databaseTables, clearTable, callbackIn)
    // async.each(config.databaseTables, clearTable, callbackIn);
}

async.waterfall([
    emptyDatabase,
    function(callback){
        require('./vote').runTest(settings.vote, callback)
    },
    emptyDatabase,
    function(callback){
        console.log('Vote test passed.')
        require('./group').runTest(settings.group, callback)
    },
    // emptyDatabase,
    function(groupAverages, callback){
        console.log('Group tests passed')
        require('./group_groups').runTest(settings.groupGroup, callback)
    }
    
], function(err){
    if(err){ console.log(err); }
    else{
        console.log('Grouping tests passed')
        console.log('grouper tests passed')
    }
})