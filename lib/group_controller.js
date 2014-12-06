(function () {

    var async = require('async');
    var models = require('../models.js').models();
    var Norm = require('./norm.js');

    var settings = {
        percentUsersToRegroup: 0.3
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

    function processGroup(group, callback){
        norm
            .table('UserGroupAgreements')
            .select(['user', 'group'])
            .where('group', '=', group.id)
            .findAll(function(error, agreements){
                if(error){ 
                    callback(error);
                } else {
                    callback(null, agreements);
                }
            });

        async.waterfall(
        [

            // get count of users in group
            function(callback){

                norm
                    .table('GroupsUsers')
                    .count('*')
                    // .where('group', '=', group.id)
                    // .findAll(function(error, agreements){
                    //     if(error){ 
                    //         callback(error);
                    //     } else {
                    //         callback();
                    //     }
                    // });


            }


        ], function(err, result){});
    }


testGroup = {id: 1}

  //   groupController.groupUsers(function(){
        // console.log('done');
  //   });

processGroup(testGroup, function(err, rows){
    if(err){ console.log(err); }
    console.log('fine');
    console.log(rows[0]);
});



    module.exports = groupController;

}());

/**
reference:

https://github.com/felixge/node-mysql

https://idiorm.readthedocs.org/en/latest/querying.html

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript

*/