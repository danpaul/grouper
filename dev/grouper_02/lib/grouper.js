var grouper = {}

var config = require('../config')

var async = require('async')

var models = require('../models/models')


/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
settings should include:
	minimumVotesToIncludeInSort
*/
grouper.groupUsers = function(settings, groupIds, callbackIn){
    async.eachSeries(groupIds, function(groupId, callback){
        processGroup(settings, groupId, callback);
    }, callbackIn);
}

/**
* Main function for processing and individual group.
* Function finds all users in group, then takes the users with the lowest
*  agreement and attempts to find, and regroup to, groups the users has
*  a higher agreement with.
*/
function processGroup(settings, groupId, callbackIn){

    var numberOfUsersInGroup;
    var userAgreements;

    async.waterfall(
    [
        // get total number of users
        function(callback){
        	models.user.countInGroup(groupId, function(err, count){
        		if( err ){ callback(err) }
        		else{
        			numberOfUsersInGroup = count;
        			callbackIn()
        		}
        	})
        },

        // get users that should be regrouped
        function(callback){

console.log(numberOfUsersInGroup);
return;

            knex('user_group_agreements')
                .select(['user', 'percentage_up'])
                .where('group', groupId)
                .andWhere('total', '>', settings.minimumVotesToIncludeInSort)
                .orderBy('percentage_up', 'asc')
                .limit(settings.numberOfUserToRegroup)
                .then(function(userAgreementsIn){
                    userAgreements = userAgreementsIn;
                    callback();
                })
                .catch(callback)
        },

        // try to find groups that user may have more agreements with
        //   and regroup user
        function(callback){
            processUsers(settings, userAgreements, groupId, callback);
        }

    ], callbackIn);
}

module.exports = grouper