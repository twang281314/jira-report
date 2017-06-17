var jiraConnect = require('../common/jira-connect');
var eventproxy = require('eventproxy');
var logger = require('../common/logger');

//根据issueId获取工作日志 
//issueIds 数组 这样能使用eventproxy进行并行处理
function getIssueWorkLogByIssueIds(issueIds, token, callback) {
    var result = [];
    var times = issueIds.length;
    var query = {
        issueKey: 0
    };
    var ep = new eventproxy();
    ep.fail(callback); //返回错误
    ep.after('getWorkLogData', times, function (list) {
        list.forEach(function (item) {
            result = result.concat(item);
        });
        callback(null, result); //返回结果
    });

    for (var i = 0; i < times; i++) {
        query.issueKey = issueIds[i];
        jiraConnect.jira(token).issue.getWorkLogs(query, function (error, data) {
            if (data && data.worklogs) {
                ep.emit('getWorkLogData', data.worklogs);
            } else {
                ep.emit('getWorkLogData', []);
            }
        });
    }
}

//根据issueKey获取工作日志 
function getIssueWorkLogByIssueKeys(issueKeys, token, callback) {

    var result = [];
    var times = issueIds.length;
    var query = {
        issueKey: ''
    };
    var ep = new eventproxy();
    ep.fail(callback); //返回错误
    ep.after('getWorkLogData', times, function (list) {
        list.forEach(function (item) {
            result = result.concat(item);
        });
        callback(null, result); //返回结果
    });

    for (var i = 0; i < times; i++) {
        query.issueKey = issueKeys[i];
        jiraConnect.jira(token).issue.getWorkLogs(query, function (error, data) {
            ep.emit('getWorkLogData', data.worklogs);
        });
    }
}

/**
 * 根据issueIds获取issueKeys
 */
function getIssueKeysByIssueIds(token, issueIds, callback) {

    var times = issueIds.length;
    var query = {
        fields: [],
        issueId: 0
    };
    var result = [];

    var ep = new eventproxy();
    ep.fail(callback);

    ep.after('getIssueKeys', times, function (list) {
        list.forEach(function (item) {
            result = result.concat(item);
        });
        callback(null, result); //返回结果
    });

    for (var i = 0; i < times; i++) {
        query.issueId = issueIds[i];
        jiraConnect.jira(token).issue.getIssue(query, function (error, data) {

            if (error) {
                callback(error);
            } else {
                ep.emit('getIssueKeys', {
                    issueId: data.id,
                    issueKey: data.key
                });
            }
        });
    }
}
exports.getIssueKeysByIssueIds = getIssueKeysByIssueIds;
exports.getIssueWorkLogByIssueIds = getIssueWorkLogByIssueIds;
exports.getIssueWorkLogByIssueKeys = getIssueWorkLogByIssueKeys;

// getIssueWorkLog(['XDW-1950', 'XDW-2045','XDW-2042'], new Buffer("wangtao:8002381")
//     .toString("base64"),
//     function (error, data) {
//         if (error) {
//             console.log(error);
//         } else {
//             logger.info(data);
//         }
//     });