var voteModel = {};

var config = require('../config')

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/



/*******************************************************************************

                            TESTING FUNCTIONS

*******************************************************************************/

/**
* Bias should be a float between 0.0 - 0.5
* Function will return 0.5 + or - bias
*/
voteModel.getRandomBias = function(bias){
    if( Math.random() >= 0.5 ){ return 0.5 + bias; }
    else{ return 0.5 - bias;  }
}

/** 
* bias should be a value close to 0.5
* if the value is less than 0.5, the vote will more likely be an upvote
* else, the vote will more likely be a downvote
*/
voteModel.getVoteFromBias = function(bias){
    if( Math.random() >= bias ){ return config.UPVOTE; }
    else{ return config.DOWNVOTE; }
}

/**
* @param - takes int userVote, float percentage of upvotes, int total votes cast
* @return - null if 1 or less votes have been cast, `UPVOTE` if user agrees, `DOWNVOTE` if
*   user disagrees
*/
voteModel.getUserAgreementVote = function( userVote, percentageGroupUpVotes, totalVotes){
    // if 1 or no votes have been made for post, or if votes are split, do nothing
    if( totalVotes <= 1 || percentageGroupUpVotes == 0.5 ){
        return null;
    } else {
        // determine if user is in agreement
        if( (userVote === config.UPVOTE && percentageGroupUpVotes > 0.5) ||
            (userVote === config.DOWNVOTE && percentageGroupUpVotes < 0.5) )
        {
            // user agrees, gets an upvote
            return config.UPVOTE;
        } else {
            // user disagrees, gets a downvote
            return config.DOWNVOTE;
        }
    }
}


/*******************************************************************************

                            OLD

*******************************************************************************/


// var async = require('async');
// var baseModel = require('./base');
// var constants = require('../constants.js');
// var knex = global.grouper_app.get('GROUPER_KNEX');


// // Bias should be a float between 0.0 - 0.5
// // Function will return 0.5 + or - bias
// voteModel.getRandomBias = function(bias){
//     if( Math.random() >= 0.5 ){ return 0.5 + bias; }
//     else{ return 0.5 - bias;  }
// }

// // bias should be a value close to 0.5
// // if the value is less than 0.5, the vote will more likely be an upvote
// // else, the vote will more likely be a downvote
// voteModel.getVoteFromBias = function(bias){
//     if( Math.random() >= bias ){ return constants.upvote; }
//     else{ return constants.downvote; }
// }

// /**
// * @param - takes int userVote, float percentage of upvotes, int total votes cast
// * @return - null if 1 or less votes have been cast, `UPVOTE` if user agrees, `DOWNVOTE` if
// *   user disagrees
// */
// voteModel.getUserAgreementVote = function( userVote, percentageGroupUpVotes, totalVotes){
//     // if 1 or no votes have been made for post, or if votes are split, do nothing
//     if( totalVotes <= 1 || percentageGroupUpVotes == 0.5 ){
//         return null;
//     } else {
//         // determine if user is in agreement
//         if( (userVote === constants.upvote && percentageGroupUpVotes > 0.5) ||
//             (userVote === constants.downvote && percentageGroupUpVotes < 0.5) )
//         {
//             // user agrees, gets an upvote
//             return constants.upvote;
//         } else {
//             // user disagrees, gets a downvote
//             return constants.downvote;
//         }
//     }
// }


// voteModel.getMultiKeyVoteQuery = function(table, columnOne, valueOne, columnTwo, valueTwo, vote){
//     var params = [table, columnOne, columnTwo, valueOne, valueTwo];
//     if( vote === constants.upvote ){
//         return {statement: constants.sql.upsertMultiKeyUpVote, 'params': params }
//     } else {
//         return {statement: constants.sql.upsertMultiKeyDownVote, 'params': params }
//     }
// }



// voteModel.updateVote = function(table, id, vote, callbackIn){

//     var params = [table, id];
//     var statement;

//     if( vote === constants.upvote ){
//         statement = constants.sql.updateVoteUpVote;
//     } else {
//         statement = constants.sql.updateVoteDownVote;
//     }

//     knex.raw(statement, params)
//         .then(function(){ callbackIn() })
//         .catch(callbackIn)
// }

module.exports = voteModel;