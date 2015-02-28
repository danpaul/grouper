var userGroupAgreement = {}

var config = require('../config')

var baseModel = require('./base')
var groupVoteModel = require('./group_vote')
var voteModel = require('./vote')

var knex = config.knex

var TABLE_NAME = 'user_group_agreement'

/*******************************************************************************

                            MAIN FUNCTIONS

*******************************************************************************/

/**
* Update user group agreement
*/
userGroupAgreement.update = function(groupId, userId, postId, vote, callbackIn){

    // get the group's vote
	groupVoteModel.get(groupId, postId, function(err, groupVote){
		if( err ){
			callbackIn(err)
			return
		}

        // this should happen since user this should only get called after
        //  user's group vote has been cast
		if( groupVote === null ){
			callbackIn();
			return;
		}

        // deterimine if user agrees with group
        var userAgreementVote =
            voteModel.getUserAgreementVote( vote,
            		   						groupVote.percentage_up,
            								groupVote.total);

        // if not enough votes or tie, do nothing
        if( userAgreementVote === null ){
        	callbackIn();
        	return;
        }

        // update user_group_agreement
        var queryObj = baseModel.getMultiKeyVoteQuery(TABLE_NAME,
        									           'user',
        									      	   userId,
        									      	   'group',
        									           groupId,
        									           userAgreementVote);


        // update 
        knex.raw(queryObj.statement, queryObj.params)
            .then(function(){ callbackIn(); })
			.catch(callbackIn)

	})
}

/**
* Passes back users with the lowest group agreement.
*/
userGroupAgreement.getUsersToRegroup = function(groupId,
                                                numberOfUserToRegroup,
                                                minimumVotesToIncludeInSort,
                                                callbackIn){

    knex(TABLE_NAME)
        .select(['user', 'percentage_up'])
        .where('group', groupId)
        .andWhere('total', '>', minimumVotesToIncludeInSort)
        .orderBy('percentage_up', 'asc')
        .limit(numberOfUserToRegroup)
        .then(function(userAgreements){
            callbackIn(null, userAgreements)
        })
        .catch(callbackIn)

}

userGroupAgreement.removeUser = function(groupId, userId, callbackIn){
    knex(TABLE_NAME)
        .where({user: userId, group: groupId})
        .del()
        .then(function(){ callbackIn() })
        .catch(callbackIn)
}

module.exports = userGroupAgreement