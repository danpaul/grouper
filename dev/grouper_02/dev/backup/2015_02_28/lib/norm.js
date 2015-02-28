// ABANDONED!!!

var mysql = require('mysql');

var debug = true;


var Table = function(tableName, connection){

    var self = this;

    this.debug = debug;

    this.connection = connection;
    this.table = tableName;

    // this.countArgument = null;
    // this.deleteClause = null;
    // this.insertClause = null;
    // this.limitClause = null;
    // this.selectClause = null;
    // this.orderClause = null;
    // this.whereClause = null;

this.statement = '';
this.params = [];

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


console.log(statement); callback();
        // if( this.debug ){ console.log(statement); }
        // this.connection.query(statement, function(err, rows, fields){
        //     if( err ){ callback(err); }
        //     else{
        //         if(self.countArgument === '*'){
        //             callback(null, rows[0]['COUNT(*)']);
        //         } else {
        //             callback(null, rows);
        //         }
        //     }            
        // });
    }

    this.findAll = function(callback){
        this.setupSelectClause();

        this.executeStatement(this.getQuery(), callback);
    }

    this.setInsertQueryPart = function(insertParams){
        var self = this;

        var first;
        var outerFirst;
        // var statement = '';
        // var queryArguments = [];

        this.statement += 'INSERT INTO ?? ';
        this.params.push(this.table);

        var sampleObj;

        if( insertParams instanceof Array ){
            sampleObj = insertParams[0];
        } else {
            sampleObj = insertParams;
        }

        // build column part
        this.statement += '(';
        first = true;

        Object.keys(sampleObj).forEach(function(column){
            if( first ){ first = false; }
            else{ this.statement += ', '; }
            this.statement += '??';
            this.params.push(column);
        });
        this.statement += ') ';

        //build values part
        this.statement += 'VALUES ';

        if( insertParams instanceof Array ){
            outerFirst = true;
            insertParams.forEach(function(clauseObj){
                if( outerFirst ){ outerFirst = false; }
                else{ this.statement += ', '}
                this.statement += '(';
                this.first = true;
                Object.keys(clauseObj).forEach(function(column){
                    if( first ){ first = false; }
                    else{ this.statement += ', '; }
                    this.statement += '?';
                    this.params.push(clauseObj[column]);
                });
                this.statement += ')';
            })
        } else {
            this.statement += '(';
            first = true;
            Object.keys(insertParams).forEach(function(column){
                if( first ){ first = false; }
                else{ statement += ', '; }
                statement += '?';
                this.params.push(self.insertClause[column]);
            });
            this.statement += ')';
        }

        // return {
        //     statementString: statement,
        //     queryArguments: queryArguments
        // }
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

    this.insert = function(insertParams){

        var self = this;

        var first;
        var outerFirst;
        // var statement = '';
        // var queryArguments = [];

        this.statement += 'INSERT INTO ?? ';
        this.params.push(this.table);

        var sampleObj;

        if( insertParams instanceof Array ){
            sampleObj = insertParams[0];
        } else {
            sampleObj = insertParams;
        }

        // build column part
        this.statement += '(';
        first = true;

        Object.keys(sampleObj).forEach(function(column){
            if( first ){ first = false; }
            else{ this.statement += ', '; }
            this.statement += '??';
            this.params.push(column);
        });
        this.statement += ') ';

        //build values part
        this.statement += 'VALUES ';

        if( insertParams instanceof Array ){
            outerFirst = true;
            insertParams.forEach(function(clauseObj){
                if( outerFirst ){ outerFirst = false; }
                else{ self.statement += ', '}
                self.statement += '(';
                self.first = true;
                Object.keys(clauseObj).forEach(function(column){
                    if( first ){ first = false; }
                    else{ self.statement += ', '; }
                    self.statement += '?';
                    self.params.push(clauseObj[column]);
                });
                self.statement += ')';
            })
        } else {
            this.statement += '(';
            first = true;
            Object.keys(insertParams).forEach(function(column){
                if( first ){ first = false; }
                else{ self.statement += ', '; }
                self.statement += '?';
                self.params.push(self.insertClause[column]);
            });
            self.statement += ')';
        }

        return this;
    }



    this.getStatement = function(){
        return mysql.format(this.statement, this.params) + '; ';
    }

    this.execute = function(callbackIn){
        if( this.debug ){ console.log(this.getStatement()); }
        this.connection.query(this.getStatement(), callbackIn);
    }

    this.castToArray = function(item){
        if( !(item instanceof Array) ){ return[item]; }
        return item;
    }

    /**
    * Litmit can be either an int or an array with 2 ints (for offset)
    *   If array is given, first defines the offset, second the number of records
    */
    this.limit = function(limitIn){
        this.statement += 'LIMIT ';
        if( this.limitClause instanceof Array ){
            this.statement += '?, ? ';
            this.params.push(limitIn[0]);
            this.push(limitIn[1]); 
        } else {
            this.statement += '? ';
            this.params.push(limitIn);
        }
        return this;
    }

    this.order = function(direction, column){
        this.statement += 'ORDER BY ?? ';
        this.params.push(column);
        if( direction === 'ASC' ){ this.statement += 'ASC '; }
        else{ this.statement += 'DESC '; }
        return this;
    }

    this.orderAsc = function(column){
        this.order('ASC', column);
        return this;
    }

    this.orderDesc = function(column){
        this.order('DESC', column);
        return this;
    }

    this.select = function(columnsIn){        
        var columns = this.castToArray(columnsIn);
        var first = true;
        var self = this;

        self.statement += 'SELECT '

        columns.forEach(function(column){
            if( first ){ first = false; }
            else { self.statement += ', '; }
            self.statement += '??';
            self.params.push(column);
        });

        self.statement += ' from ?? ';
        self.params.push(self.table);

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

    this.debug = debug;

    this.table = function(tableName){
        return new Table(tableName, this.connection);
    }

    this.executeRaw = function(statement, params, callback){
        var formattedStatement = mysql.format(statement, params);
// console.log(formattedStatement); callback(); return;
console.log(formattedStatement);
        // if( this.debug ){ console.log(statement);
        this.connection.query(formattedStatement, function(err, rows, fields){
            if( err ){ callback(err); }
                else{ callback(null, rows); }
        });
    }
}

module.exports = Norm;