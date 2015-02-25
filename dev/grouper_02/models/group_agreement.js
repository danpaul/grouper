var groupAgreement = {}

var settings = require('../settings').groupAgreement

var async = require('async')

// sets agreement percentage in group_agreements table for all groups
groupAgreement.group = function(callbackIn){
	// var groupIds;
	async.waterfall([

		// // get all groups
		// function(callback){
		// 	// return;
		// 	groupModel.getAllGroupIds(function(err, groupIdsIn){
		// 		if(err){ callback(err) }
		// 		else{
		// 			groupIds = _.sortBy(groupIdsIn, function(groupId){
		// 				return groupId;
		// 			});
		// 			callback()
		// 		}
		// 	})
		// },

		// function(callback){
		// 	var currentIndex = 0;
		// 	// iterate through each group
		// 	async.eachSeries(groupIds, function(groupA, callbackB){
		// 		// groupA's recent votes
		// 		groupVoteModel.getRecentOrderedPosts(groupA,
		// 											 settings.maxPoststoCompare,
		// 											 function(err, groupAVotes){

		// 			if(err){ callbackB(err); }
		// 			else{

		// 				// get the remaining groups to iterate through
		// 				var groupBs = groupIds.slice(currentIndex)

		// 				var groupAPostMap = mapPosts(groupAVotes)

		// 				// iterate through group bs
		// 				async.eachSeries(groupBs, function(groupB, callbackC){
		// 					// get groupBs recent votes
		// 					groupVoteModel.getRecentOrderedPosts(groupB,
		// 														 settings.maxPoststoCompare,
		// 														 function(err, groupBVotes){
		// 						if( err ){ callbackC(err) }
		// 						else{

		// 							// get post map
		// 							var groupBPostMap = mapPosts(groupBVotes)
		// 							var averageVoteDifference = getVoteDifferenceAverage(groupAPostMap, groupBPostMap);

		// 							if( averageVoteDifference !== null ){
		// 								updateAgreement(groupA,
		// 												groupB,
		// 												averageVoteDifference,
		// 												callbackC)
		// 							}

		// 						}
		// 					})
		// 				}, callbackB)
		// 			}
		// 		})
		// 		currentIndex++;
		// 	}, callback)
		// }

	], callbackIn)
}


module.exports = groupAgreement


// // group agreements define the agreement between different groups

// (function(){

// var groupModel = require('./group');
// var groupVoteModel = require('./group_vote');


// var groupAgreementModel = {};

// var _ = require('underscore');
// var async = require('async');
// // var baseModel = require('./base');
// // var constants = require('../constants');
// var knex = global.grouper_app.get('GROUPER_KNEX');
// // var voteModel = require('./vote');

// var settings = {
// 	// the max # of posts to compare between groups
// 	maxPoststoCompare: 1000,
// 	// minumum number of total votes to make comparison for a single post
// 	minVotesForComparison: 3,
// 	// will only update total if this many successful comparisons are made
// 	minComparisonsToUpdate: 2
// }

// // sets agreement percentage in group_agreements table for all groups
// groupAgreementModel.groupGroups = function(callbackIn){
// 	var groupIds;
// 	async.waterfall([

// 		// get all groups
// 		function(callback){
// 			// return;
// 			groupModel.getAllGroupIds(function(err, groupIdsIn){
// 				if(err){ callback(err) }
// 				else{
// 					groupIds = _.sortBy(groupIdsIn, function(groupId){
// 						return groupId;
// 					});
// 					callback()
// 				}
// 			})
// 		},

// 		function(callback){
// 			var currentIndex = 0;
// 			// iterate through each group
// 			async.eachSeries(groupIds, function(groupA, callbackB){
// 				// groupA's recent votes
// 				groupVoteModel.getRecentOrderedPosts(groupA,
// 													 settings.maxPoststoCompare,
// 													 function(err, groupAVotes){

// 					if(err){ callbackB(err); }
// 					else{

// 						// get the remaining groups to iterate through
// 						var groupBs = groupIds.slice(currentIndex)

// 						var groupAPostMap = mapPosts(groupAVotes)

// 						// iterate through group bs
// 						async.eachSeries(groupBs, function(groupB, callbackC){
// 							// get groupBs recent votes
// 							groupVoteModel.getRecentOrderedPosts(groupB,
// 																 settings.maxPoststoCompare,
// 																 function(err, groupBVotes){
// 								if( err ){ callbackC(err) }
// 								else{

// 									// get post map
// 									var groupBPostMap = mapPosts(groupBVotes)
// 									var averageVoteDifference = getVoteDifferenceAverage(groupAPostMap, groupBPostMap);

// 									if( averageVoteDifference !== null ){
// 										updateAgreement(groupA,
// 														groupB,
// 														averageVoteDifference,
// 														callbackC)
// 									}

// 								}
// 							})
// 						}, callbackB)
// 					}
// 				})
// 				currentIndex++;
// 			}, callback)
// 		}

// 	], callbackIn)
// }

// // takes group id and number of groups
// // passes back a maximum of that many groups with the least amount of disagreement
// groupAgreementModel.getAgreeingGroups = function(groupId, numberOfGroups, callbackIn){
// 	knex('group_agreements')
// 		.select(['group_a', 'group_b', 'disagreement_average'])
// 		.where({'group_a': groupId})
// 		.orWhere({'group_b': groupId})
// 		.orderBy('disagreement_average', 'asc')
// 		.limit(numberOfGroups)
// 		.then(function(groupAgreementsIn){
// 			var groupAgreements = _.map(groupAgreementsIn, function(agreement){
// 				var groupBid;
// 				if( agreement.group_a !== groupId ){
// 					groupBid = agreement.group_a
// 				} else {
// 					groupBid = agreement.group_b
// 				}

// 				return({
// 					group: groupBid,
// 					disagreement_average: agreement.disagreement_average
// 				})
// 			})
// 			callbackIn(null, groupAgreements);
// 		})
// 		.catch(callbackIn)
// }

// // calculates the average difference between tow groups votes
// // if insufficent comparison were made, returns null, else returns the average difference
// var getVoteDifferenceAverage = function(groupAPostMap, groupBPostMap){
// 	var totalComparisons = 0;
// 	var totalDifference = 0.0;
// 	_.each(groupAPostMap, function(post, postId){
// 		// only do comparisons if each group has enought post votes
// 		if( (post.total >= settings.minVotesForComparison) &&
// 			(typeof(groupBPostMap[postId.toString()]) !== 'undefined' ) &&
// 			(groupBPostMap[postId.toString()]['total'] >= settings.minVotesForComparison )
// 		){
// 			totalComparisons++;
// 			totalDifference += Math.abs(post.percentage_up - groupBPostMap[postId.toString()]['percentage_up'])
// 		}
// 	})

// 	if( totalComparisons >= settings.minComparisonsToUpdate ){
// 		return( totalDifference / totalComparisons );
// 	} else {
// 		return null;
// 	}

// }

// // takes array of objects, each obj. should have post key
// // returns an object with the post id as the key
// var mapPosts = function(postArray){
// 	var postMap = {};
// 	_.each(postArray, function(postObj){
// 		postMap[postObj.post] = postObj;
// 	})
// 	return postMap;
// }

// // updates agreement percentages
// var updateAgreement = function(groupA, groupB, averageVoteDifference, callbackIn){
// 	var upsertStatment = 'INSERT INTO `group_agreements` ' +
// 		'(`group_a`, `group_b`, `disagreement_average`) VALUES (?, ?, ?) ' +
// 		'ON DUPLICATE KEY UPDATE disagreement_average=?';
// 	var params = [groupA, groupB, averageVoteDifference, averageVoteDifference];

// 	knex.raw(upsertStatment, params)
// 		.then(function(){ callbackIn(); })
// 		.catch(callbackIn)

// }


// module.exports = groupAgreementModel;


// }())