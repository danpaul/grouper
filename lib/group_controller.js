(function () {

    var async = require('async');
    var models = require('../models.js').models();
    var Norm = require('./norm.js');

    var UPVOTE = 0;
    var DOWNVOTE = 1;

    var settings = {
        groupsToCompareUser: 5,
        maximumGroupsToCompare: 10,
        minimumGroupVotesToCompare: 1,
        minimumVotesToIncludeInSort: 2,
        minimumVotesToDoUserComparison: 1,
        percentUsersToRegroup: 0.3,
        userPostVotesToCompare: 3
    }

    var mysqlCreds = {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'grouper',
        port: 8889
    }
    var norm = new Norm(mysqlCreds);
    var groupController = {};

    groupController.groupUsers = function(callback){

        norm.table('Groups').findAll(function(error, groups){
            if(error){ callback(error); }
            else{
                async.eachSeries(groups, processGroup, callback);
            }
        });
    }

    function findGroupsUserDoesntBelongTo(userId, callback){

        norm.table('GroupsUsers')
            .where('UserId', '=', userId)
            .select(['GroupId'])
            .limit(settings.maximumGroupsToCompare)
            .findAll(function(err, groupIds){
                if(err){ callback(err); }
                else{
                    var cleanArray = [];
                    groupIds.forEach(function(groupObj){
                        cleanArray.push(groupObj['GroupId']);
                    });
                    callback(null, cleanArray);
                }
            });
    }




function userAgrees( userVote, percentageGroupUpVotes ){
    // determine if user is in agreement
    if( (userVote === UPVOTE && percentageGroupUpVotes > 0.5) ||
        (userVote === DOWNVOTE && percentageGroupUpVotes < 0.5) )
    {
        // user agrees
        return true;
    } else {
        // user disagrees, gets a downvote
        return false;
    }
}






    function compareVotes(groupId, postVotes, postVoteIds, callback){
        //get all group UserGroupAgreement
        norm.table('PostGroupVotes')
            .select(['percentageUp', 'total', 'postId'])
            .where('groupId', '=', groupId)
            .where('postId', 'in', postVoteIds)
            .findAll(function(err, postAgreements){                
                if( err ){ callback(err); }
                else{

                    if( postAgreements < settings.minimumGroupVotesToCompare ){
                        callback(null, null);
                    } else {
                        var agreedVotes = 0;
                        var totalVotes = 0;
                        postAgreements.forEach(function(agreement){
                            totalVotes += 1;

                            // user vote
                            var uv = postVotes[agreement.postId];
                            // group vote perentage
                            var gvp = agreement.percentageUp;

                            if( userAgrees(uv, gvp) ){
                                agreedVotes += 1;                            
                            }
                        });
                        callback(null, (agreedVotes / totalVotes));
                    }
                }
            })



    }

    function compareUserWithAlternateGroups(userId, userVotes, callback){

userId = 1;

        // find X number of groups user does not belong to
        findGroupsUserDoesntBelongTo(userId, function(err, groupIds){

            if(err){ callback(err); }
            else{
                if( groupIds.length > 0 ){

                    postVoteIds = [];
                    postVotes = {};
                    voteAgreements = [];

                    userVotes.forEach(function(v){
                        postVoteIds.push(v.post);
                        postVotes[v.post] = v.vote;
                    });

                    async.eachSeries(groupIds, function(groupId, callback_b){
                        compareVotes(groupId, postVotes, postVoteIds, function(err, percentage){
                            if( err ){ callback_b(err); }
                            else{
                                if( percentage !== null ){
                                    voteAgreements.push({
                                        groupId: groupId,
                                        agreePercentage: percentage
                                    });
                                }
                                callback_b();
                            }
                        })
                    },
                    function(err){
                        if(err){ callback(err); }
                        else{

console.log(voteAgreements);

                            callback()

                        }
                    });

// console.log(userVotes);


// console.log(userVotes);
// console.log(groupIds);

                } else { callback(); }
            }

        });

        // for each group, find all user agreements for each of user posts
        //    compare with user and determine which groups user has highest
        //    with

        // if user has higher agreement with alternative group and a sufficient
        //    number of votes to compare, asign user to new group, unasign from 
        //    old group


    }

    function processUser(userId, groupId, callbackIn){

        // find X number user posts
        norm.table('UserVotes')
            .where('user', '=', userId)
            .select(['vote', 'post'])
            .orderDesc('id')
            .limit(settings.userPostVotesToCompare)
            .findAll(function(err, userVotes){
                if(err){ callbackIn(err); }
                else{
                    //check if user has enough votes to compare
                    if( userVotes.length > settings.minimumVotesToDoUserComparison ){
                        compareUserWithAlternateGroups(userId, userVotes, callbackIn);
                    } else {
                        callbackIn();
                    }

                    // if()
// console.log(userVotes.length);
                }
            })

        // async.waterfall([


        





        // ], callbackIn)

    }

    function processGroup(groupId, callbackIn){

//         norm
//             .table('UserGroupAgreements')
//             .select(['user', 'group', 'up'])
//             .where('group', '=', group.id)
//             .orderAsc('up')
//             .orderDesc('user')

//             .limit([1, 10])
//             .findAll(function(error, agreements){
//                 if(error){ 
//                     callback(error);
//                 } else {
// console.log(agreements);
//                     // callback(null, agreements);
//                 }
//             });


    


        async.waterfall(
        [

            // get count of users in group
            function(callback){
                norm
                    .table('GroupsUsers')
                    .where('GroupId', '=', groupId)
                    .countAll(function(err, count){
                        if(err){ callback(err); }
                        else{ callback(null, count); }
                    });
            },

            // get users that should be regrouped
            function(numberOfUsersInGroup, callback){

                numberOfUserToRegroup =
                    Math.floor(settings.percentUsersToRegroup * numberOfUsersInGroup);

                norm
                    .table('UserGroupAgreements')
                    .select(['user', 'percentageUp'])
                    .where('group', '=', groupId)
                    .where('total', '>', settings.minimumVotesToIncludeInSort)
                    .orderAsc('percentageUp')
                    .limit(numberOfUserToRegroup)
                    .findAll(function(err, agreements){
                        if(err){ callback(err); }
                        else{ callback(null, agreements); }
                    });
            },

            // try to find groups that user may have more agreements with
            // agreement has user and percentageUp members
            function(agreements, callback){
                async.eachSeries(agreements, function(agreement, agreemenCallback){
                    processUser(agreement.user, groupId, agreemenCallback);
                }, function(err){
                    if(err){ callback(err); }
                    else{ callback(null); }
                })



                //find all 

// console.log(agreements);

            }


        ], callbackIn);
    }


testGroup = 1;

  //   groupController.groupUsers(function(){
        // console.log('done');
  //   });

processGroup(testGroup, function(err, rows){
    if(err){ console.log(err); }
    console.log('fine');
    // console.log(rows);
});



    module.exports = groupController;

}());

/**
reference:

https://github.com/felixge/node-mysql

https://idiorm.readthedocs.org/en/latest/querying.html

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript

*/