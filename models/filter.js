/**
 * 过滤器实体
 */

var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var eventproxy = require('eventproxy');
var _ = require('lodash');

//查询接口 支持分页
function getDataByJql(data, token, callback) {
    var result = []; //存放返回结果
    var times = 1;
    var jql = '';
    if (data.filterJql.length > 0) {
        jql = data.filterJql;
    } else {
        jql = "filter=" + data.filterId
    }
    var query = {
        "jql": jql,
        "startAt": 0,
        "maxResults": 100,
        "fields": [
            "summary",
            "status",
            "assignee",
            "aggregatetimeoriginalestimate",
            "aggregatetimespent",
            "aggregateprogress",
            "aggregatetimeestimate",
            "worklog",
            "parent",
            "timetracking"
        ],
        "fieldsByKeys": false
    };
    
    //自定义需要返回的字段
    if (data.fields && data.fields.length > 0) {
        query.fields = data.fields;
    }

    jiraConnect.jira(token).search.search(query, function (error, data) {
        if (error) {
            callback(error);
        } else {
            result = result.concat(data.issues);
            times = Math.floor(data.total / query.maxResults);
            var ep = new eventproxy();
            ep.fail(callback); //返回错误
            ep.after('getJiraData', times, function (list) {
                list.forEach(function (item) {
                    result = result.concat(item);
                });
                callback(null, result); //返回结果
            });

            for (var i = 1; i <= times; i++) {
                query.startAt = query.maxResults * i;
                jiraConnect.jira(token).search.search(query, function (error, data) {
                    if (data && data.issues) {
                        ep.emit('getJiraData', data.issues);
                    } else {
                        ep.emit('getJiraData', []);
                    }
                });
            }
        }
    });
}

exports.getDataByJql = getDataByJql;