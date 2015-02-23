module.exports = {

	vote: {
	    numberOfGroups: 10, // should be at least 10
	    numberOfPosts: 100, // should be at least 10
	    numberOfUsers: 10, // should be at least 10
	    numberOfBiasTests: 1000,
	    numberOfTestVotes: 10, // should also be even
	    testBias: 0.1
	},

	group: {
	    numberOfCycles: 10,
	    numberOfUsers: 10,
	    numberOfGroups: 3,
	    numberOfGroupings: 3,
	    numberOfPosts: 20,
	    testBias: 0.4,

		// the following are used for grouping function
		minimumVotesToIncludeInSort: 1,
		// number of user to regroup in each group
    	numberOfUserToRegroup: 3,
    	// number of user votes that get compated
       	userPostVotesToCompare: 5,
       	// users with fewer than these votes will not be regrouped
       	minimumVotesToDoUserComparison: 1,
		// maximum number of groups user will be compared to when regrouping
    	maximumGroupsToCompare: 5

	}
}