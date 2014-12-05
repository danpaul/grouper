var mysql = require('mysql');


var Table = function(tableName, connection){

    this.connection = connection;
    this.table = tableName; 
    this.whereClause = null;

    this.findAll = function(callback){

        var statement = 'SELECT * from ?? ';
        var queryArguments = [this.table];

        if( this.whereClause !== null ){
            statement += 'WHERE ';
            var first = true;

            this.whereClause.forEach(function(clause){
                if( first ){ first = false; }
                else{ statement += 'AND '; }
                statement += '?? ' + clause[1] + ' ? ';
                queryArguments.push(clause[0]);
                queryArguments.push(clause[2]);
            });

        }
        this.executeStatement(mysql.format(statement, queryArguments), callback);
    }

    this.where = function(column, comparator, value){
        if( this.whereClause === null ){ this.whereClause = []; }
        this.whereClause.push([column, comparator, value]);
        return this;
    }

    this.executeStatement = function(statement, callback){
        this.connection.query(statement, function(err, rows, fields){
            if( err ){ callback(err); }
            else{ callback(null, rows); }
        });
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