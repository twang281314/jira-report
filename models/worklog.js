/**
 * worklog相关
 */

var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var moment = require('moment');
moment.locale('zh-cn');
var eventproxy = require('eventproxy');

//根据日志更新时间获取日志ids
//由于接口限制最多1000条 因此使用递归获取全部记录
function getWorkLogIdsByUpdatedTime(token, startTime, items, callback) {
    jiraConnect.jira(token).worklog.getWorklogUpdated({
        since: startTime
    }, function (error, result) {
        if (error) {
            callback(error, null);
        } else {
            items = items.concat(result.values);
            if (result.lastPage) {
                callback(null, items);
            } else {
                getWorkLogIdsByUpdatedTime(token, result.until, items, callback);
            }
        }
    });
}

//根据日志ids获取日志数据
//接口ids每次最多1000条 使用eventproxy并发处理
function getWorkLogsByIds(token, ids, callback) {
    var count = Math.floor(ids.length / 1000);
    var remainder = ids.length % 1000;
    var times = count + (remainder == 0 ? 0 : 1); //调用接口次数
    var result=[];
    var query = {
        ids: []
    };

    var ep = new eventproxy();
    ep.fail(callback); //返回错误
    ep.after('getWorkLogData', times, function (list) {
        list.forEach(function (item) {
            result = result.concat(item);
        });
        callback(null, result); //返回结果
    });

    for (var i = 1; i <= times; i++) {
        query.ids = ids.splice(0, 1000);
        jiraConnect.jira(token).worklog.worklogList(query, function (error, data) {
            if (data) {
                ep.emit('getWorkLogData', data);
            } else {
                ep.emit('getWorkLogData', []);
            }
        });
    }
}

exports.getWorkLogIdsByUpdatedTime = getWorkLogIdsByUpdatedTime;
exports.getWorkLogsByIds = getWorkLogsByIds;