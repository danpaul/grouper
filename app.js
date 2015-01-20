/*


To start: npm start
To start nodemon: nodemon ./bin/www

[INGORE THIS]Sequlizer DB sync issue: in development, delete DB, uncomment app.sequelize sync
    block. start app. comment out app.sequelize sync block, restart

        - see documentation use sequelize.drop() and sequelize.sync({force: true}) instead
            + (at bottom of models.js)

INIT DB: manutally create gruoper DB, uncommonent sync line at bottom of models.js file

*/

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser');
var expressSession = require('express-session');




var app = express();
app.set('GROUPER_ENV', 'local');
require('./settings').init(app);



var Sequelize = require('sequelize');

var routes = require('./routes/index');
var users = require('./routes/users');
var posts = require('./routes/posts');

var groupTest = require('./test/group');
groupTest.runTests(function(err){
    if(err){ console.log(err) }
    else{ console.log('success'); }
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser('2djFjH$i@c$M0lcOMnr0Z!3s'));
app.use(expressSession({
    secret: '0ZY2arQLI5kqnEcK0p1rXBmX',
    resave: true,
    saveUninitialized: true
}));

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/', users);
app.use('/', posts);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// app.listen(3000);



module.exports = app;
