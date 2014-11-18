var initializing = false;

var Sequelize = require('sequelize');

var sequelize = new Sequelize('grouper', 'root', 'root', {
    dialect: "mysql",
    port: 8889,
    logging: false
});

// module.exports.models = function(sequelize){
module.exports.models = function(){

    var models = {};

    models.User = sequelize.define('User', {
        email: {
            type: Sequelize.STRING,
            unique: true,
            validate: {
                isEmail: {
                    args: [true],
                    msg: 'The email address is not valid.'
                }
            }
        },
        username: {
            type: Sequelize.STRING,
            unique: true
        },
        password: {
            type: Sequelize.STRING
        } 
    });

    models.Post = sequelize.define('Post', {
        title: {
            type: Sequelize.STRING,
            validate: {
                len:{
                    args: [2, 255],
                    msg: 'The title must be between 2 and 255 characters.'                  
                }
            }
        },
        url: {
            type: Sequelize.STRING,
            validate: {
                isUrl: {
                    args: [true],
                    msg: 'The URL is not valid.'
                }
            }
        },
        user: {
            type: Sequelize.INTEGER,
            references: models.User,
            referencesKey: "id"
        }
    });

    models.UserVote = sequelize.define('UserVote', {
        vote: Sequelize.BOOLEAN,
        user: {
            type: Sequelize.INTEGER,
            references: models.User,
            referencesKey: "id"
        },
        post: {
            type: Sequelize.INTEGER,
            references: models.Post,
            referencesKey: "id"
        } 
    });

    models.Group = sequelize.define('Group', { });

    // models.GroupsUsers = sequelize.define('GroupsUsers', {
    //  userId: {
    //      type: Sequelize.INTEGER,
    //      references: models.User,
    //      referencesKey: "id"
    //  },
    //  groupId: {
    //      type: Sequelize.INTEGER,
    //      references: models.Group,
    //      referencesKey: "id"
    //  }
    // });

    models.PostVoteTotal = sequelize.define('PostVoteTotal', {
        post: {
            type: Sequelize.INTEGER,
            references: models.Post,
            referencesKey: "id"
        },
        up: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        down: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        percentageUp: {
            type: Sequelize.FLOAT,
            defaultValue: 0.0
        }
    });

    models.PostGroupVote = sequelize.define('PostGroupVote', {
        postId: {
            type: Sequelize.INTEGER,
            references: models.Post,
            referencesKey: "id"
        },
        groupId: {
            type: Sequelize.INTEGER,
            references: models.Group,
            referencesKey: "id"
        },
        up: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        down: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        percentageUp: {
            type: Sequelize.FLOAT,
            defaultValue: 0.0
        }
    });





    models.UserGroupAgreement = sequelize.define('UserGroupAgreement', {
        user: {
            type: Sequelize.INTEGER,
            // references: models.User,
            // referencesKey: "id",
// unique: 'compositeIndex'
        },
        group: {
            type: Sequelize.INTEGER,
            // references: models.Group,
            // referencesKey: "id",
// unique: 'compositeIndex'
        },
        up: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        down: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        percentageUp: {
            type: Sequelize.FLOAT,
            defaultValue: 0.0
        }
    });

/*******************************************************************************
ASSOCIATIONS
*******************************************************************************/

    models.Group.hasMany(models.User);
    models.User.hasMany(models.Group);


/*******************************************************************************
INDEXES
*******************************************************************************/

    if( initializing ){

        var queries = [
            // 'CREATE UNIQUE INDEX `user_group_agreement` ON `UserGroupAgreements` (`user`, `group`);',
            'CREATE UNIQUE INDEX  `post_group_vote` ON `PostGroupVotes` (`postId`, `groupId`);'
        ];

        queries.forEach(function(query){
            sequelize.query(query)
                .success(function(){})
                .error(function(e){ console.log(e); })        
        });

    }


    sequelize.sync();

    return models;
}