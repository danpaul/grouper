var decay = require('decay')
var assert = require('assert')

var rank = {}

var defaultZScore = 1.0
var defaultTimeToZero = 60 * 60 * 24 * 7 // one week

// takes optional Wilson Z score and time to zero (in seconds)
// rank declines linearly with time
rank.wilsonDecay = function(zScoreIn, timeToZeroIn){
	var zScore = zScoreIn || defaultZScore
	var timeToZero = timeToZeroIn || defaultTimeToZero
	var wilsonScore = decay.wilsonScore(zScore)

	// created is a timestamp in seconds
	return function(upVotes, downVotes, created){
		var timeDifference = rank.getCurrentTimestamp() - created
		if( timeDifference > timeToZero ){ return 0 }
		var timeDecay = 1 - timeDifference / timeToZero
		return timeDecay * wilsonScore(upVotes, downVotes)
	}
}

rank.wilson = function(zScoreIn){
	var zScore = zScoreIn || defaultZScore
	return decay.wilsonScore(zScore)
}

rank.getCurrentTimestamp = function(){
	return Math.floor(Date.now() / 1000)
}

rank.test = function(){
	var wd = rank.wilsonDecay()
	var zeroAgo = wd(100, 100, rank.getCurrentTimestamp())
	var twoHoursAgo = wd(100, 100, rank.getCurrentTimestamp() - (60 * 60 * 2))
	var eightHoursAgo = wd(100, 100, rank.getCurrentTimestamp() - (60 * 60 * 8))
	var oneDayAgo = wd(100, 100, rank.getCurrentTimestamp() - (60 * 60 * 24))
	var oneWeekAgo = wd(100, 100, rank.getCurrentTimestamp() - (60 * 60 * 24 * 7))

	console.log(zeroAgo)
	console.log(twoHoursAgo)
	console.log(eightHoursAgo)
	console.log(oneDayAgo)
	console.log(oneWeekAgo)

	assert((zeroAgo > twoHoursAgo > eightHoursAgo > oneDayAgo > oneWeekAgo), 'Rank order is wrong.')
	assert( oneWeekAgo === 0, 'One week ago should be zero.')

	console.log('rank success')
}

module.exports = rank;