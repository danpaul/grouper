// check post group votes

var express = require('express');
var router = express.Router();

var models = require('../models.js').models();

var helpers = require('../inc/helpers.js');
var async = require('async');

var voteController = require('../lib/vote_controller.js');
var groupController = require('../lib/group_controller.js');

// voteController.seed();

// groupController.groupUsers();


/********************************************************************************
                POSTS
********************************************************************************/

// new post get request
router.get('/api/post/new', function(req, res) {
    helpers.checkLogin(req, res);
    res.render('newpost');
});

// add new post (post request)
router.post('/api/post/new', function(req, res){

    helpers.checkLogin(req, res);

    // construct post
    var post = Post.build({
        url: req.body.url,
        title: req.body.title,
        user: req.session.user.id
    });

    // validate post
    var validationResult = post.validate();

    if( validationResult !== null ){
        res.send(validationResult);
        return;
    }

    // save post
    post.save()
        .success(function(post){
            res.send(true);
        })
        .error(helpers.reportGenericError)
});

// display all posts
router.get('/api/posts/all', function(req, res) {

    Post.findAll()
        .success(function(posts){
            res.render('allposts', { posts: posts });
        })
        .error(helpers.reportGenericError);
});



/********************************************************************************
                VOTES
********************************************************************************/

router.post('/api/post/vote', function(req, res) {

    // helpers.checkLogin(req, res);

    var postId = req.body.id;
    var vote = req.body.vote;
    // var userId = req.session.user.id;



userId = 2;



    // confirm postId is set
    if( typeof(postId) === 'undefined' ){
        helpers.reportGenericError('Invalid user or post ID', res);
        return;
    }

    // confirm a valid vote is present
    if( !(vote === 'up' || vote === 'down') ){
        helpers.reportGenericError('Invalid vote.', res);
        return;
    }

    // set mapped vote value
    var mappedVote = VOTE_MAP[vote];

    // // confirm post exists
    // Post.find(postId)
    //     .success(function(post){
    //         if( post === null ){
    //             helpers.reportGenericError('Post ID not found.', res);
    //             return;
    //         }

    //         // confirm user has not yet voted for post
    //         UserVote.find(post.id)
    //         .success(function(userVote){

    //             // if uservote already exists, return error
    //             if( userVote !== null ){
    //                 helpers.reportGenericError('You  have already voted for this post.', res);
    //                 return;
    //             }

    //             // if uservote doesn't exist, create it
    //             UserVote.create({
    //                 vote: mappedVote,
    //                 user: userId,
    //                 post: postId
    //             })
    //             .success(function(voteObject){

    //                 // send response and continue processing
    //                 res.send(true);

    //                 // find vote total
    //                 PostVoteTotal.find({where: {post: post.id}})
    //                 .success(function(postVoteTotal){

    //                     // update post vote total( postVoteTotal is created automatically when
    //                     //      a new post is created)
    //                     updatePostVoteTotal(post.id, mappedVote, helpers.logError);

    //                 })
    //                 .error(function(e){ helpers.reportHiddenError(e, res); })
    //                 //update group votes
                    
    //                 return;
    //             })
    //             .error(function(){
    //                 helpers.reportGenericError('Unable to save record.', res)
    //                 return;
    //             })

    //         })
    //         .error(function(){
    //             helpers.reportGenericError('Unable to retrieve record.', res);
    //             return;
    //         })

    //     })
    //     .error(function(e){
    //         helpers.reportGenericError(e, res);
    //         return;
    //     })

});

module.exports = router;