//assoc example

User.find(2)
    .success(function(user){
        user.getGroups()
        .success(function(groups){
			console.log(groups.length);
        })
        .error(function(e){console.log(e);})
    });

var addUserToGroup = function(userId, groupId, callback){
addUserToGroup(2, 4, function(){ console.log('done')});