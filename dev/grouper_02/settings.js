var settings = {}

settings.groupAgreement = {
	// the max # of posts to compare between groups
	maxPoststoCompare: 1000,
	// minumum number of total votes to make comparison for a single post
	minVotesForComparison: 3,
	// will only update total if this many successful comparisons are made
	minComparisonsToUpdate: 2
}

module.exports = settings