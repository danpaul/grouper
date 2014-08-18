//  nodemon bin/www

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var Sequelize = require('sequelize');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.sequelize = new Sequelize('grouper', 'root', 'root', {
    dialect: "mysql",
    port: 8889,
});

app.models = require('./models.js').models(app.sequelize);

app.sequelize
    .sync({ force: true })
    .complete(function(err) {
        if (!!err) {
            console.log('An error occurred while creating the table:', err);
        } else {
            console.log('It worked!');
        }
    });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser('2djFjH$i@c$M0lcOMnr0Z!3s'));
app.use(expressSession({secret: '0ZY2arQLI5kqnEcK0p1rXBmX'}));

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

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


module.exports = app;
