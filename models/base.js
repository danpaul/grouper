var baseModel = {};

var config = require('../config')
var async = require('async');
var knex = config.knex;

/*******************************************************************************

                            CONSTANTS

*******************************************************************************/

var UPDATE_UP_VOTE = 'UPDATE ?? SET total = total + 1, up = up + 1, percentage_up = up / total WHERE id=?; ';
var UPDATE_DOWN_VOTE = 'UPDATE ?? SET total = total + 1, down = down + 1, percentage_up = up / total WHERE id=?; ';

var MULTI_KEY_UPVOTE = 'INSERT INTO ?? (??, ??, up, total, percentage_up) VALUES (?, ?, 1, 1, 1.0) ON DUPLICATE KEY UPDATE total = total + 1, up = up + 1, percentage_up = up / total ';
var MULTI_KEY_DOWNVOTE = 'INSERT INTO ?? (??, ??, down, total, percentage_up) VALUES (?, ?, 1, 1, 0.0) ON DUPLICATE KEY UPDATE total = total + 1, down = down + 1, percentage_up = up / total ';

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
* Inserts data into table
*/
baseModel.add = function(table, dataIn, callbackIn){
    knex(table)
        .insert(dataIn)
        .then(function(rows){ callbackIn(null, rows[0]); })
        .catch(callbackIn);
}

/**
* Inserts votes, updates if it doesn't yet exist
*/
baseModel.updateVote = function(table, id, vote, callbackIn){

    var params = [table, id];
    var statement;

    if( vote === config.UPVOTE ){
        statement = UPDATE_UP_VOTE;
    } else {
        statement = UPDATE_DOWN_VOTE;
    }

    knex.raw(statement, params)
        .then(function(){ callbackIn() })
        .catch(callbackIn)
}

/*******************************************************************************

                            HELPER FUNCTIONS

*******************************************************************************/

// gets statement and params for a vote upsert into a table with multi-colum
//  key
baseModel.getMultiKeyVoteQuery = function(tableName,
                                          columnOne,
                                          valueOne,
                                          columnTwo,
                                          valueTwo,
                                          vote){

    var params = [tableName, columnOne, columnTwo, valueOne, valueTwo];
    if( vote === config.UPVOTE ){
        return {statement: MULTI_KEY_UPVOTE, 'params': params }
    } else {
        return {statement: MULTI_KEY_DOWNVOTE, 'params': params }
    }
}

// returns current unix timestamp
baseModel.getCurrentTimestamp = function(){
    return Math.floor(Date.now() / 1000)
}

module.exports = baseModel;