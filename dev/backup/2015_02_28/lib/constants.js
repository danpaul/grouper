// var constants = {
//     sql: {
//         'upsert_multi_key_upvote': 'INSERT INTO ?? (??, ??, up, total, percentage_up) VALUES (?, ?, 1, 1, 1.0) ON DUPLICATE KEY UPDATE total = total + 1, up = up + 1, percentage_up = up / total ',
//         'upsert_multi_key_downvote': 'INSERT INTO ?? (??, ??, down, total, percentage_up) VALUES (?, ?, 1, 1, 0.0) ON DUPLICATE KEY UPDATE total = total + 1, down = down + 1, percentage_up = up / total '
//     },
//     upvote:  0,
//     downvote: 1
// }

// module.exports = constants;