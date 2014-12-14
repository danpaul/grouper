module.exports.init = function(app){

    var client = 'mysql';
    var db = {};
    var env = app.get('GROUPER_ENV');
    var knex;
    var pool = {};

    // set a local app reference
    global.grouper_app = app;

    if( env === 'local' ){
        db.host = 'localhost';
        db.user = 'root';
        db.password = 'root';
        db.database = 'grouper';
        db.port = 8889;

        pool.min = 0;
        pool.max = 10;
    }

    knex = require('knex')({
        'client': client,
        'connection': db,
        'pool': pool
    });

    app.set('GROUPER_KNEX', knex);



};