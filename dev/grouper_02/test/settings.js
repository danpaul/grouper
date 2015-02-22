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
	    testBias: 0.4
	}
}