var testing = true;

var express = require('express');
var app = express();

app.set('GROUPER_ENV', 'local');
require('./settings').init(app);


var Sequelize = require('sequelize');

var routes = require('./routes/index');
var users = require('./routes/users');
var posts = require('./routes/posts');

if( testing ){

	var test = require('./test/test')
	test.runTest()

}

app.use('/', routes);
app.use('/', users);
app.use('/', posts);

module.exports = app;