(function(){


var postModel = {};
var async = require('async');
var baseModel = require('./base');
var knex = global.grouper_app.get('GROUPER_KNEX');

postModel.add = function(postData, callbackIn){
    // TODO: validation
    baseModel.add('posts', postData, callbackIn);
}

postModel.createSeedPosts = function(numberOfPosts, userId, callbackIn){

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
        postModel.add(post, function(err, postId){
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

module.exports = postModel;


}())