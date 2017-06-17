// jiraConnect.jira(new Buffer("wangtao:8002381")
//         .toString("base64"))
//     .issue.getIssue({
//         issueKey: 'XDW-1949'
//     }, function (error, result) {

//         if (error) {
//             logger.error(error);
//         } else {
//             logger.info(JSON.stringify(result));
//         }
//     });

// jiraConnect.jira(new Buffer("wangtao:8002381")
//     .toString("base64")).worklog.worklogList({
//     ids: ['13205']
// }, function (error, result) {

//     if (error) {
//         logger.error(error);
//     } else {
//         logger.info(JSON.stringify(result));
//     }
// });

var workLogs = [];
getWorkLogIdsByUpdatedTime(
    new Buffer("wangtao:8002381").toString("base64"),
    moment('2015-09-01').format('x'),
    workLogs,
    function (error, result) {
        if (error) {
            logger.info(error);
        } else {
            logger.info(result.length);
        }
    });