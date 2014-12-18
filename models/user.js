(function(){


var userModel = {};
var async = require('async');
var baseModel = require('./base');
var knex = global.grouper_app.get('GROUPER_KNEX');

userModel.add = function(userData, callbackIn){
	// TODO: validation
	baseModel.add('users', userData, callbackIn);
}

userModel.createSeedUsers = function(numberOfUsers, callbackIn){

    var users = [];
    var userIds = [];
    var currentTime = new Date().getTime()

    for( var i = 0; i < numberOfUsers; i++ ){
        users.push({
            email: 'email_' + i.toString() + '_' + currentTime + '@asdf.com',
            username: 'user_' + i.toString() + '_' + currentTime,
            password: '$2a$08$YgEm3NLhcn5JG36MDovQIuf6Js1jaa4BWGoYRYI5VmcCrMYzEArOi'
        });
    }

    async.eachSeries(users, function(user, callback){
    	userModel.add(user, function(err, userId){
    		if(err){ callback(err); }
    		else{
    			userIds.push(userId)
    			callback();
    		}
    	})
    }, function(err){
    	if(err){ callbackIn(err); }
    	else{ callbackIn(null, userIds); }
    })
}

module.exports = userModel;

}())