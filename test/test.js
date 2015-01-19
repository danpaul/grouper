/** 
* TESTING EMPTYS THE DB!!!
*/
(function () {
    var async = require('async');
    var knex = global.grouper_app.get('GROUPER_KNEX');

    var constants = require('../constants');

    var groupTest = require('./group');
    var groupingTest = require('./grouping');
    var voteTest = require('./vote');

    var test = {};

    test.runTest = function(){
        async.waterfall([
            test.emptyDatabase,
            // voteTest.runTest,
            // test.emptyDatabase,
            groupingTest.runTest,
            // groupTest.runTest,
            // test.emptyDatabase
        ], function(err){
            if(err){ console.log(err); }
            else{ console.log('grouper tests passed'); }
        })
    }

    // test.emptyDatabase = function(callbackIn){
    //     async.each(constants.databaseTables, test.clearTable, callbackIn);
    // }

    // test.clearTable = function(table, callbackIn){
    //         knex(table)
    //             .truncate()
    //             .then(function(){ callbackIn(); })
    //             .catch(callbackIn)
    // }

    module.exports = test;

}());