(function(){


module.exports = {
    upvote: 0,
    downvote: 1,
    sql: {
        'upsertMultiKeyUpVote': 'INSERT INTO ?? (??, ??, up, total, percentage_up) VALUES (?, ?, 1, 1, 1.0) ON DUPLICATE KEY UPDATE total = total + 1, up = up + 1, percentage_up = up / total ',
        'upsertMultiKeyDownVote': 'INSERT INTO ?? (??, ??, down, total, percentage_up) VALUES (?, ?, 1, 1, 0.0) ON DUPLICATE KEY UPDATE total = total + 1, down = down + 1, percentage_up = up / total ',
        'updateVoteUpVote': 'UPDATE ?? SET total = total + 1, up = up + 1, percentage_up = up / total WHERE id=?; ',
        'updateVoteDownVote': 'UPDATE ?? SET total = total + 1, down = down + 1, percentage_up = up / total WHERE id=?; '
    },
    databaseTables: [
        'groups',
        'groups_users',
        'group_votes',
        'posts',
        'users',
        'user_group_agreements',
        'user_votes'
    ]
}


}())