var async = require('async')
var models = require('../models/models')

var seed = {}

/**
* Takes number of groups and creates that many groups.
* Callback gets called with an array of group ids.
*/
seed.groups = function(numberOfGroups, callbackIn){

    var groups = [];
    var groupIds = [];

    for( var i = 0; i < numberOfGroups; i++ ){ groups.push({}); }

    async.eachSeries(groups, function(group, callback){
        models.group.add(group, function(err, groupId){
            if(err){ callback(err); }
            else{
                groupIds.push(groupId)
                callback();
            }
        })
    }, function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(null, groupIds); }
    })
}

/**
* Takes number of posts and a user id, creates that many psts.
* Callback gets called with an array of post ids.
*/
seed.posts = function(numberOfPosts, userId, callbackIn){

    var posts = [];
    var postIds = [];
    var currentTime = new Date().getTime()

    for( var i = 0; i < numberOfPosts; i++ ){
        posts.push({
            title: 'post_title_' + i.toString() + '_' + currentTime,
            user: userId,
            url: 'www.foo.com/' + i.toString() + '_' + currentTime
        });
    }

    async.eachSeries(posts, function(post, callback){
        models.post.add(post, function(err, postId){
            if(err){ callback(err); }
            else{
                postIds.push(postId)
                callback();
            }
        })
    }, function(err){
        if(err){ callbackIn(err); }
        else{ callbackIn(null, postIds); }
    })
}

/**
* Takes number of users and creates that many users.
* Callback gets called with an array of user ids.
*/
seed.users = function(numberOfUsers, callbackIn){

    var users = [];
    var userIds = [];
    var currentTime = new Date().getTime()
    var i;

    for( i = 0; i < numberOfUsers; i++ ){
        users.push({
            email: 'email_' + i.toString() + '_' + currentTime + '@asdf.com',
            username: 'user_' + i.toString() + '_' + currentTime,
            password: '$2a$08$YgEm3NLhcn5JG36MDovQIuf6Js1jaa4BWGoYRYI5VmcCrMYzEArOi'
        });
    }

    async.eachSeries(users, function(user, callback){
    	models.user.add(user, function(err, userId){
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


module.exports = seed