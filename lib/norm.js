var mysql = require('mysql');


var Table = function(tableName, connection){
	this.table = tableName;
	this.connection = connection;
	this.where = null;

	this.findAll = function(callback){
		var statement = mysql.format('SELECT * from ??', [this.table]);

		this.connection.query(statement, function(err, rows, fields){
			if( err ){ callback(err); }
			else{
				callback(null, rows);
			}
		});
	}

	this.where = function(column, comparator, value){

return this;
// .where('group', '=', group.id)


	}
}

var Norm = function(connectionCreds){

	this.connection = mysql.createConnection(connectionCreds);
	this.connection.connect();

	this.table = function(tableName){
		return new Table(tableName, this.connection);
	}

}

module.exports = Norm;