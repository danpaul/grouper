var config = {}

/*******************************************************************************

                            CONSTANTS

*******************************************************************************/

config.UPVOTE = 0
config.DOWNVOTE = 1

/*******************************************************************************

                            ENV

*******************************************************************************/

var db = {}
var pool = {}

var client = 'mysql';

config.environment = process.env.NODE_ENV

config.databaseTables = [
    'group',
    'group_vote',
    'post',
    'user',
    'user_group_agreement',
    'user_vote',
    'group_agreement'
]

switch(config.environment){
    case 'development':
        db.host = 'localhost'
        db.user = 'root'
        db.password = 'root'
        db.database = 'grouper'
        db.port = 8889
        pool.min = 0
        pool.max = 10
        config.knexDebug = false
        break;

    case 'production':
        config.debug = false
        console.log('prod')
        config.knexDebug = false
        break;

    default:
        throw('Grouper app must be started with env variable.')
}

config.knex = require('knex')({
    'client': client,
    'connection': db,
    'pool': pool,
    'debug': config.knexDebug
});

module.exports = config