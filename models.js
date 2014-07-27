var Sequelize = require('sequelize');

module.exports.models = function(sequelize){

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
			type: Sequelize.STRING,
			// validate: {
			// 	len:{
			// 		args: [8,24],
			// 		msg: 'The password must be between 8 and 24 characters.'
			// 	}
			// }
		} 
	});


	models.Post = sequelize.define('Post', {
		url: Sequelize.STRING,
		title: Sequelize.STRING,
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

	models.UserGroup = sequelize.define('UserGroup', {
		user: {
			type: Sequelize.INTEGER,
		  	references: models.User,
		  	referencesKey: "id"
		},
		group: {
			type: Sequelize.INTEGER,
			references: models.Group,
			referencesKey: "id"
		}	  
	});

	models.PostVoteTotal = sequelize.define('PostVoteTotal', {
		post: {
			type: Sequelize.INTEGER,
			references: models.Post,
			referencesKey: "id"
		},
		plus: Sequelize.INTEGER,
		minus: Sequelize.INTEGER,
		total: Sequelize.INTEGER,
		percentagePlus: Sequelize.FLOAT
	});

	models.PostGroupVote = sequelize.define('PostGroupVote', {
		post: {
			type: Sequelize.INTEGER,
			references: models.Post,
			referencesKey: "id"
		},
		group: {
			type: Sequelize.INTEGER,
			references: models.Group,
			referencesKey: "id"
		},
		plus: Sequelize.INTEGER,
		minus: Sequelize.INTEGER,
		total: Sequelize.INTEGER,
		percentagePlus: Sequelize.FLOAT
	});

	models.UserGroupAgreement = sequelize.define('UserGroupAgreement', {
		user: {
			type: Sequelize.INTEGER,
			references: models.User,
			referencesKey: "id"
		},
		group: {
			type: Sequelize.INTEGER,
			references: models.Group,
			referencesKey: "id"
		},
		agree: Sequelize.INTEGER,
		disagree: Sequelize.INTEGER,
		agreePercentage: Sequelize.FLOAT
	});

	return models;
}