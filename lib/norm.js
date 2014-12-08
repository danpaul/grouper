var mysql = require('mysql');


var Table = function(tableName, connection){

    var self = this;

    this.debug = true;

    this.connection = connection;
    this.table = tableName;

    this.countArgument = null;
    this.deleteClause = null;
    this.insertClause = null;
    this.limitClause = null;
    this.selectClause = null;
    this.orderClause = null;
    this.whereClause = null;

    this.countAll = function(callback){
        this.countArgument = '*';
        this.selectClause = 'count';
        this.executeStatement(this.getQuery(), callback);
    }

    this.delete = function(callback){
        this.deleteClause = true;
        this.executeStatement(this.getQuery(), callback);
    }

    this.executeStatement = function(statement, callback){
        if( this.debug ){ console.log(statement); }
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

    this.getInsertQueryPart = function(){
        var statement = '';
        var queryArguments = [];

        statement += 'INSERT INTO ?? ';
        queryArguments.push(this.table);

        var sampleObj;

        if( this.insertClause instanceof Array ){
            sampleObj = this.insertClause[0];
        } else {
            sampleObj = this.insertClause;
        }

        // build column part
        statement += '(';
        Object.keys(sampleObj).forEach(function(column){
            if( first ){ first = false; }
            else{ statement += ', '; }
            statement += '??';
            queryArguments.push(column);
        });
        statement += ') ';

        //build values part
        statement += 'VALUES ';

        if( this.insertClause instanceof Array ){
            var outerFirst = true;
            this.insertClause.forEach(function(clauseObj){
                if( outerFirst ){ outerFirst = false; }
                else{ statement += ', '}
                statement += '(';
                Object.keys(clauseObj).forEach(function(column){
                    if( first ){ first = false; }
                    else{ statement += ', '; }
                    statement += '?';
                    queryArguments.push(clauseObj[column]);
                });
                statement += ')';
            })
        } else {

            throw('fix this');

        }

        return {
            statementString: statement,
            queryArguments: queryArguments
        }
    }

    this.getQuery = function(){
        var statement = '';
        var queryArguments = [];

        if( this.deleteClause !== null ){
            statement += 'DELETE FROM ?? ';
            queryArguments.push(this.table);
        }

        if( this.insertClause !== null ){

            var insertQueryPart = this.getInsertQueryPart();
            statement += insertQueryPart.statementString;
            queryArguments.push.apply(queryArguments, insertQueryPart.queryArguments);
        }

        if( this.selectClause !== null ){
            statement += 'SELECT '
            if( this.selectClause === '*' ){
                statement += '* ';
            } else if( this.selectClause instanceof Array ) {
                var first = true;
                this.selectClause.forEach(function(row){
                    if( first ){
                        first = false;
                    } else {
                        statement += ', '
                    }
                    statement += '??';
                    queryArguments.push(row);
                });
                statement += ' '
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

                if( clause[1] === 'in' ){
                    statement += '?? IN(';
                    queryArguments.push(clause[0]);
                    var first_b = true;
                    clause[2].forEach(function(columnValue){
                        if( first_b ){ first_b = false; }
                        else{
                            statement += ', ';
                        }
                        statement += '?'
                        queryArguments.push(columnValue);
                    });
                    statement += ') ';
                } else {
                    statement += '?? ' + clause[1] + ' ? ';
                    queryArguments.push(clause[0]);
                    queryArguments.push(clause[2]);
                }

            });
        }

        if( this.orderClause !== null ){
            statement += 'ORDER BY ';
            var first = true;
            this.orderClause.forEach(function(clause){
                if( first ){ first = false; }
                else{ statement += ', '; }
                statement += '?? ' + clause[0];
                queryArguments.push(clause[1]);
            });
            statement += ' ';
        }

        if( this.limitClause !== null ){
            statement += 'LIMIT ';
            if( this.limitClause instanceof Array ){
                statement += '?, ? ';
                queryArguments.push(this.limitClause[0]);
                queryArguments.push(this.limitClause[1]);
            } else {
                statement += '? ';
                queryArguments.push(this.limitClause);
            }
        }
        return mysql.format(statement, queryArguments);
    }

    this.insert = function(record, callback){
        this.insertClause = record;
        this.executeStatement(this.getQuery(), callback);
    }

    /**
    * Litmit can be either an int or an array with 2 ints (for offset)
    *   If array is given, first defines the offset, second the number of records
    */
    this.limit = function(limit){
        this.limitClause = limit;
        return this;
    }

    this.order = function(direction, field){
        if( this.orderClause === null ){ this.orderClause = []; }
        this.orderClause.push([direction, field]);
        return this;
    }

    this.orderAsc = function(field){
        this.order('ASC', field);
        return this;
    }

    this.orderDesc = function(field){
        this.order('DESC', field);
        return this;
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