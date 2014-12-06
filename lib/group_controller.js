(function () {

    var async = require('async');
    var models = require('../models.js').models();
    var Norm = require('./norm.js');

    var settings = {
        percentUsersToRegroup: 0.3,
        minimumVotesToIncludeInSort: 2
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
            function(agreements){
                // async.eachSeries(agreements, function)

console.log(agreements);

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