var testing = false;

var express = require('express');
var app = express();

app.set('GROUPER_ENV', 'local');
require('./settings').init(app);


var Sequelize = require('sequelize');

var routes = require('./routes/index');
var users = require('./routes/users');
var posts = require('./routes/posts');

if( testing ){
    var groupGroupingTest = require('./test/group_groups');

    groupGroupingTest.runTest(function(err){
        if(err){ console.log(err) }
        else{ console.log('success'); }
    });
}

app.use('/', routes);
app.use('/', users);
app.use('/', posts);

module.exports = app;