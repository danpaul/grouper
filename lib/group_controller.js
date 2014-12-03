(function () {




    var async = require('async');
    var models = require('../models.js').models();

    var groupController = {};

    groupController.groupUsers = function(){

    }

    module.exports = groupController;


var mysql = require('mysql');

// var connection = mysql.createConnection({
// 	host: 'localhost',
// 	user: 'root',
// 	password: 'root',
// 	port: 8889
// });

// connection.connect();

var Table = function(tableName, connection){
	this.table = tableName;
	this.connection = connection;

	this.findAll = function(callback){
		var query = 'SELECT * from `' + this.table + '`;';
		this.connection.query(query, function(err, rows, fields){

console.log(rows[0]);

		})
		console.log('finding');
	}
}

var Norm = function(connectionCreds){

	this.connection = mysql.createConnection(connectionCreds);
	this.connection.connect();

	this.forTable = function(tableName){
		return new Table(tableName, this.connection);
	}

}


// console.log(Norm.forTable('foo'));
// console.log('foo');

var mysqlCreds = {
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'grouper',
	port: 8889
}

var norm = new Norm(mysqlCreds);

norm.forTable('PostVoteTotals').findAll();



}());

/**
reference:

https://github.com/felixge/node-mysql

https://idiorm.readthedocs.org/en/latest/querying.html

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript

*/