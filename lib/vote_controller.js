(function () {

    var voteController = {}

    var models = require('../models.js').models();

    var helpers = require('../lib/helpers.js');
    var async = require('async');

    var Norm = require('./norm.js');
    var mysqlCreds = {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'grouper',
        port: 8889
    }
    var norm = new Norm(mysqlCreds);

    /********************************************************************************
                    CONSTANTS / DATA
    ********************************************************************************/

    var UPVOTE = 0;
    var DOWNVOTE = 1;
    var VOTE_MAP = {
        up: 0,
        down: 1
    };
    var ASYNC_CONCURRENCY_LIMIT = 1;

    var Group = models.Group;
    var Post = models.Post;
    var PostGroupVote = models.PostGroupVote;
    var PostVoteTotal = models.PostVoteTotal;
    var User = models.User;
    var UserGroupAgreement = models.UserGroupAgreement;
    var UserVote = models.UserVote;


    /********************************************************************************
                VOTE FUNCTIONS
    ********************************************************************************/

    // Takes user and post models, does all vote updating magic then calls callback
    var castUserVote =  voteController.castUserVote = function(
                                                        user,
                                                        post,
                                                        vote,
                                                        callback){

    // castUserVote(user, post, UPVOTE, callback_c);

        // confirm user has not yet voted for post
        UserVote.find({ where: {
            user: user.id,
            post: post.id
        }})

        .success(function(userVote){

            // if uservote already exists, return and don't do anything else
            if( userVote !== null ){ callback(); return; }

            // create user vote
            UserVote.create({
                vote: vote,
                user: user.id,
                post: post.id
            })

            .success(function(userVote){
                // find vote total
                // this should get refractored out and just added to the post
                PostVoteTotal.findOrCreate({
                    post: post.id
                })
                .success(function(postVoteTotal){
                    // update post vote total
                    updateVote(postVoteTotal, vote, function(){
                        // handle group votes
                        updateGroupVotes(user, post.id, vote, callback);
                    });
                })
                .error(callback)
            })
            .error(callback)
        })
        .error(callback)
    }

    var updateGroupVotes = voteController.updateGroupVotes = function(
                                                                user,
                                                                postId,
                                                                vote,
                                                                callback){

        user.getGroups().success(function(groups){
            // async.eachLimit(groups, ASYNC_CONCURRENCY_LIMIT, function(group, callback_b){
            async.eachSeries(groups, function(group, callback_b){
    // console.log(group.id);
                registerPostGroupVote(user.id, postId, group.id, vote, callback_b);
            }, function(e){
                if(e){ callback(e); } else { callback(); }
            })
        })
        .error(callback)
    }

    /********************************************************************************
                GROUP FUNCTIONS
    ********************************************************************************/

    var removeUserFromGroup = voteController.removeUserFromGroup = function(
                                                                        userId,
                                                                        groupId,
                                                                        callback){

        User.find(userId).success(function(user){
            Group.find(groupId).success(function(group){
                user.removeGroup(group).success(callback)
                .error(callback)
            })
            .error(callback)    
        })
        .error(callback)

    }


    /********************************************************************************
                HELPER FUNCTIONS
    ********************************************************************************/

    // updates model insance vote total
    // vote must be either 0 (upvote) or 1 (downvote)
    // instance should follow convention and have these fields: up, down, total,
    //      percentageUp
    var updateVote = voteController.updateVote = function(instance, vote, callback){

        // validate vote
        if( !(vote === 0 || vote === 1) ){
            callback('The following is not a valid vote: ' + vote);
            return;
        }

        // set up or down vote field
        var incrementField = 'up';
        if( vote === 1 ){ var incrementField = 'down'; }

        // increment correct value and adjust percentageUp and total vote
        instance.increment( incrementField, {by: 1}).success(function(newInstance){ 
            newInstance.reload().success(function(reloadedInstance){
                reloadedInstance.percentageUp = 
                    calculatePercentageUp(reloadedInstance.up, reloadedInstance.down);
                reloadedInstance.total = reloadedInstance.up + reloadedInstance.down;
                reloadedInstance.save()
                .success(function(finalInstance){ callback(null, finalInstance)})
                .error(callback);
            })
            .error(callback)
        })
        .error(callback);

    }

    // registers group vote for a post (you should verify that user belongs to group)
    //  (you should also verify that user has not already voted for post)
    // vote must be either 0 or 1 (0 for up, 1 for down)
    var registerPostGroupVote = voteController.registerPostGroupVote = function(
                                                                        userId,
                                                                        postId,
                                                                        groupId,
                                                                        vote,
                                                                        callback){

        // find or create postGroupVote
        PostGroupVote.findOrCreate({
            groupId: groupId,
            postId: postId
        // update vote
        }).success(function(postGroupVote){
            // updateVote(postGroupVote, vote, callback);
            updateVote(postGroupVote, vote, function(err, updatedPostGroupVote){
                if(err){ callback(err); }
                else{
                    updateUserGroupAgreement(
                        userId,
                        groupId,
                        updatedPostGroupVote,
                        vote,
                        callback
                    );
                }
            });
        })
        .error(callback)
    }


    var updateUserGroupAgreement = voteController.updateUserGroupAgreement = function(
                                                                                userId,
                                                                                groupId,
                                                                                postGroupVote,
                                                                                userVote,
                                                                                callback,
                                                                                isNotFirstCall){

        UserGroupAgreement.findOrCreate({
            group: groupId,
            user: userId
        })

        // update vote
        .success(function(userGroupAgreement, created){

            userAgreementVote = getUserAgreementVote(
                                    userVote,
                                    postGroupVote.percentageUp,
                                    postGroupVote.total
                                );

            if( userAgreementVote === null ){
                callback();
            } else {
                updateVote(userGroupAgreement, userAgreementVote, callback);
            }

        })
        .error(
            // retry once in case record was inserted before writing
            function(e){
                if( typeof(isNotFirstCall) === 'undefined' ){
                    updateUserGroupAgreement(
                                    userId,
                                    groupId,
                                    postGroupVote,
                                    userVote,
                                    callback,
                                    true);
                }else{
                    callback(e);
                }
            }
        )
    }

    /**
    * @param - takes int userVote, float percentage of upvotes, int total votes cast
    * @return - null if 1 or less votes have been cast, `UPVOTE` if user agrees, `DOWNVOTE` if
    *   user disagrees
    */
    var getUserAgreementVote = voteController.getUserAgreementVote = function(
                                                                        userVote,
                                                                        percentageGroupUpVotes,
                                                                        totalVotes){

        // if 1 or no votes have been made for post, or if votes are split, do nothing
        if( totalVotes <= 1 || percentageGroupUpVotes == 0.5 ){
            return null;
        } else {
            // determine if user is in agreement
            if( (userVote === UPVOTE && percentageGroupUpVotes > 0.5) ||
                (userVote === DOWNVOTE && percentageGroupUpVotes < 0.5) )
            {
                // user agrees, gets an upvote
                return UPVOTE;
            } else {
                // user disagrees, gets a downvote
                return DOWNVOTE;
            }
        }
    }

    // calculates percentage of upvotes (avoids divide by zero)
    var calculatePercentageUp = voteController.calculatePercentageUp = function(
                                                                        upVotes,
                                                                        downVotes){
        if( downVotes <= 0.0 ){
            if( upVotes >= 0.0 ){ return 1.0;
            } else { return 0.0 }
        } 
        if( upVotes <= 0.0 ){ return 0.0; }
        return(upVotes / (upVotes + downVotes));
    }

    /********************************************************************************
                    TESTING / SEEDING
    ********************************************************************************/

    var seed = voteController.seed = function(callbackIn){

        var numberOfGroups = 4;
        var numberOfPosts = 10;
        var numberOfUsers = 20;

        var users = [];
        var posts = [];
        var groups = [];

        console.log('seeding started');

        async.series([

             // 20 down vote
    





function(callback){

    var groupObjs = Array.apply(null, Array(numberOfGroups)).map(function() { return {} });

    norm.table('Groups')
        .insert(groupObjs, function(err, rows){
            if( err ){ callback(err); }
            else{
console.log(rows);
                callback();
            }

        })

// console.log(groupObjs);

//     console.log('in groups');
//     callback();

}


        ], callbackIn);



            // create groups
            // function(callback){

            //     async.whilst(

            //         function () { return numberOfGroups > 0; },

            //         function (callback_b) {
            //             Group.create()
            //             .success(function(newGroup){
            //                 groups.push(newGroup);
            //                 numberOfGroups--;
            //                 callback_b();
            //             })
            //             .error(callback_b)
            //         },

            //         function (err) {
            //             if( err ){ callback(err); }
            //             else{ 
            //                 console.log('groups created');
            //                 callback(); }
            //         }
            //     );

            // },

            // // find or create a bunch of users
            // function(callback){

            //     async.whilst(

            //         function () { return numberOfUsers > 0; },

            //         function (callback_b) {
            //             User.findOrCreate({
            //                 email: 'asdf' + numberOfUsers.toString() + '@asdf.com',
            //                 username: 'asdf' + numberOfUsers.toString(),
            //                 password: '$2a$08$YgEm3NLhcn5JG36MDovQIuf6Js1jaa4BWGoYRYI5VmcCrMYzEArOi'
            //             })
            //             .success(function(newUser){

            //                 users.push(newUser);

            //                 numberOfUsers--;
            //                 callback_b();
            //             })
            //             .error(function(e){
            //                 callback_b(e);
            //             })
            //         },

            //         function (e) {
            //             if( e ){ console.log(e); callback(e); }
            //             else{
            //                 console.log('users created');
            //                 callback();
            //             }
            //         }
            //     );

            // },

            // // create a bunch of posts
            // function(callback){

            //     async.whilst(

            //         function () { return numberOfPosts > 0; },

            //         function (callback_b) {
            //             Post.create({
            //                 title: numberOfPosts.toString() + '_asdf',
            //                 user: users[0]['id'],
            //                 url: 'www.foo.com'
            //             })
            //             .success(function(newPost){
            //                 posts.push(newPost);
            //                 numberOfPosts--;
            //                 callback_b();
            //             })
            //             .error(callback_b)
            //         },

            //         function (e) {
            //             if( e ){ console.log(e); callback(e); }
            //             else{
            //                 console.log('posts created');
            //                 callback();
            //             }
            //         }
            //     );

            // },

            // // // add users to groups
            // function(callback){
            //     async.eachSeries(users, function(user, callback_b){
            //         async.eachLimit(groups, 10, function(group, callback_c){
            //             user.addGroup(group)
            //                 .success(function(){callback_c(); })
            //                 .error(function(e){ callback_c(e); })
            //         }, function(e){
            //             if(e){ callback_b(e); }
            //             else { callback_b(); }
            //         })
            //     }, function(e){
            //         if(e){ console.log(e); callback(e); }
            //         else{
            //             console.log('users added to groups');
            //             callback();
            //         }
            //     })
            // },

            // // create user votes (odd users vote for odd posts and even users vote
            // //      for event posts)
            // function(callback){
            //     async.eachSeries(
            //         users,
            //         function(user, callback_b){
            //             async.eachSeries(
            //                 posts,
            //                 function(post, callback_c){
            //                     if( true ){
            //                         if( Math.random() < 0.5 ){
            //                             castUserVote(user, post, UPVOTE, callback_c);
            //                         } else {
            //                             castUserVote(user, post, DOWNVOTE, callback_c);
            //                         }

            //                     } else {

            //                         // users likes post
            //                         // if( (user.id % 2) == (post.id % 2) ){
            //                         //     castUserVote(user, post, UPVOTE, callback_c);

            //                         // // user does not like post
            //                         // } else {
            //                         //     castUserVote(user, post, DOWNVOTE, callback_c);
            //                         // }
            //                     }
            //                 },
            //                 function(e){   
            //                     if(e){ console.log(e); callback_b(e); }
            //                     else{ callback_b(); }
            //                 }
            //             );

            //         },
            //         function(e){
            //             if(e){ console.log(e); callback(e); }
            //             else{ callback(); }
            //         }
            //     );
            //}
            // ,

            // function(callback){
            //     console.log('user votes cast');
            //     console.log('finished seeding');
            //     callback();
            // }

        // ]);

    }

    module.exports = voteController;

}());