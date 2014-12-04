(function () {

    var async = require('async');
    var models = require('../models.js').models();
    var Norm = require('./norm.js');

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
    		// .where('group', '=', group.id)
    		.findAll(function(error, agreements){
console.log(agreements[0]);
callback();
    		});
// console.log(group.id);
		callback();
    }

    groupController.groupUsers(function(){
console.log('done');
    });













	module.exports = groupController;

}());

/**
reference:

https://github.com/felixge/node-mysql

https://idiorm.readthedocs.org/en/latest/querying.html

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript

*/