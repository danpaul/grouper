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

// Udpates user group agreements
userGroupAgreement.update = function(groupId, userId, postId, vote, callbackIn){

	groupVoteModel.get(groupId, postId, function(err, groupVote){
		if( err ){
			callbackIn(err)
			return
		}

		if( groupVote === null ){
			callbackIn();
			return;
		}

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



        knex.raw(queryObj.statement, queryObj.params)
            .then(function(){ callbackIn(); })
			.catch(callbackIn)

	})
}

module.exports = userGroupAgreement