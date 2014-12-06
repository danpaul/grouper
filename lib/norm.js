var mysql = require('mysql');


var Table = function(tableName, connection){

    var self = this;

    this.connection = connection;
    this.table = tableName;

    this.countArgument = null;
    this.selectClause = null;
    this.whereClause = null;

    this.countAll = function(callback){
        this.countArgument = '*';
        this.selectClause = 'count';
        this.executeStatement(this.getQuery(), callback);
    }

    this.executeStatement = function(statement, callback){
        this.connection.query(statement, function(err, rows, fields){
            if( err ){ callback(err); }
            else{

                if(self.countArgument === '*'){
                    callback(null, rows[0]['COUNT(*)']);
                } else {
                    callback(null, rows);
                }
            }            
        });
    }

    this.findAll = function(callback){
        this.setupSelectClause();
        this.executeStatement(this.getQuery(), callback);
    }

    this.getQuery = function(){
        var statement = '';
        var queryArguments = [];

        if( this.selectClause !== null ){
            statement += 'SELECT '
            if( this.selectClause === '*' ){
                statement += '* ';
            } else if( this.selectClause instanceof Array ) {
                this.selectClause.forEach(function(row){
                    statement += '?? ';
                    queryArguments.push(row);
                });
            }

            if( this.countArgument !== null ){
                statement += 'COUNT';
                if( this.countArgument === '*' ){
                    statement += '(*) '
                }
            }

            statement += 'from ?? ';
            queryArguments.push(this.table);
        }

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

        return mysql.format(statement, queryArguments);
    }

    this.select = function(rows){
        this.selectClause = rows;
        return this;
    }

    this.setupSelectClause = function(){
        if( this.selectClause === null ){ this.selectClause = '*'; }
    }

    this.where = function(column, comparator, value){
        if( this.whereClause === null ){ this.whereClause = []; }
        this.whereClause.push([column, comparator, value]);
        return this;
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