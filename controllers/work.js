/**
 * 工作量统计报表
 */

var config = require('../config');
var eventproxy = require('eventproxy');
var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var _ = require('lodash');
var tools = require('../common/tools');
var moment = require('moment');
moment.locale('zh-cn');
var filter = require('../models/filter');
var issue = require('../models/issue');

exports.index = function (req, res, next) {

    res.render('pages/work/index', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        username: JSON.parse(req.cookies.cookie).username,
        title: config.title
    });
}

//查询工作量统计报表数据
exports.getWorkReportData = function (req, res, next) {

    var ep = new eventproxy();

    ep.fail(next);

    var filterId = req.body.filterId; //过滤器ID
    var workStartTimeBegain = req.body.workStartTimeBegain; //工作时间 开始
    var workStartTimeEnd = req.body.workStartTimeEnd; //工作时间 结束

    ep.all('getWorkData', function (getWorkData, getFilterJql) {
        //logger.info(JSON.stringify(getWorkData));
        //当查询条件中没有workLogDate时 时间设为空
        // if (getFilterJql.jql.toLowerCase().indexOf('worklogdate') < 0) {
        //     workStartTimeBegain = ''; //工作时间 开始
        //     workStartTimeEnd = ''; //工作时间 结束
        // }
        var userDataArray = [];
        getWorkData.forEach(function (issue) {
            if (issue.fields.assignee) { //过滤掉未分配的任务

                var userData = {};
                //jira根据worklogDate进行筛选时 实际上是workLog的更新时间
                //实际需求 需要根据workLog的started进行统计
                //因为在jira中今天可以补昨天的日志 此时根据日志的更新时间 来进行统计结果不准确
                var workLogs = [];
                workLogs = issue.fields.worklog.worklogs;
                var workLogsFilter = _.filter(workLogs, function (workLog) {
                    if (workStartTimeBegain != '' && workStartTimeEnd != '') {
                        return moment(workStartTimeBegain).isSameOrBefore(moment(workLog.started).format('L')) &&
                            moment(workStartTimeEnd).isSameOrAfter(moment(workLog.started).format('L'));
                    } else if (workStartTimeBegain != '') {
                        return moment(workStartTimeBegain).isSameOrBefore(moment(workLog.started).format('L'));
                    } else if (workStartTimeEnd != '') {
                        return moment(workStartTimeEnd).isSameOrAfter(moment(workLog.started).format('L'));
                    } else {
                        return true;
                    }
                });

                var timeSpentSeconds = 0;
                if (workLogsFilter.length > 0) {
                    workLogsFilter.forEach(function (workLogFilter) {
                        timeSpentSeconds = timeSpentSeconds + workLogFilter.timeSpentSeconds;
                    });
                }

                userData.userName = issue.fields.assignee.displayName;
                userData.timeSpentSeconds = timeSpentSeconds; //工作日志中的工时
                userData.timeTrackingSpentSeconds = issue.fields.timetracking.timeSpentSeconds || 0; //耗费时间
                userData.aggregatetimeoriginalestimate = issue.fields.aggregatetimeoriginalestimate; //预估时间
                userData.aggregatetimeestimate = issue.fields.aggregatetimeestimate; //剩余时间
                userDataArray.push(userData);
            }
        });

        var userDataArrayNew = _.groupBy(userDataArray, function (userData) {
            return userData.userName;
        });

        var userDataArraySum = _.mapValues(userDataArrayNew, function (n) {

            var aggregatetimeoriginalestimate = 0;
            var aggregatetimeestimate = 0;
            var timeSpentSeconds = 0;
            var timeTrackingSpentSeconds = 0;
            n.forEach(function (obj) {
                timeSpentSeconds = timeSpentSeconds + obj.timeSpentSeconds;
                timeTrackingSpentSeconds = timeTrackingSpentSeconds + obj.timeTrackingSpentSeconds;
                aggregatetimeoriginalestimate = aggregatetimeoriginalestimate + obj.aggregatetimeoriginalestimate;
                aggregatetimeestimate = aggregatetimeestimate + obj.aggregatetimeestimate;
            });

            return {
                timeTrackingSpentSeconds: timeTrackingSpentSeconds,
                timeSpentSeconds: timeSpentSeconds,
                aggregatetimeoriginalestimate: aggregatetimeoriginalestimate,
                aggregatetimeestimate: aggregatetimeestimate
            };
        });

        //定义数组 构建echart报表数据源

        var resultData = [];
        var userNameReport = [];
        var timeSpentSecondsReport = [];
        var timeTrackingSpentSecondsReport = [];

        _.mapKeys(userDataArraySum, function (value, key) {
            var obj = {};
            obj.userName = key + '\n\n' + value.timeSpentSeconds / 3600;
            obj.timeSpentSeconds = value.timeSpentSeconds / 3600;
            resultData.push(obj);
            return key;
        });

        //排序
        resultData = tools.sortObj(resultData, 'timeSpentSeconds', 'desc');
        var timeSpentSecondsSum = 0;

        resultData.forEach(function (obj) {
            timeSpentSecondsSum = timeSpentSecondsSum + obj.timeSpentSeconds;
            userNameReport.push(obj.userName);
            timeSpentSecondsReport.push(obj.timeSpentSeconds);
        });

        var timeSpentSecondsAverage = userNameReport.length == 0 ? 0 : timeSpentSecondsSum / userNameReport.length;

        var result = {
            userName: userNameReport,
            timeSpent: timeSpentSecondsReport,
            timeSpentSecondsAverage: _.ceil(timeSpentSecondsAverage, 2)
        };

        res.send(JSON.stringify(result));
    });

    filter.getWorkData(filterId, JSON.parse(req.cookies.cookie).token, ep.done('getWorkData'))
}

//工时统计(统计所有任务和子任务中日志记录)
exports.getAllWorkReportData = function (req, res, next) {

    var response = {
        success: true,
        data: {},
        msg: ''
    };
    var token = JSON.parse(req.cookies.cookie).token;
    var ep = new eventproxy();
    ep.fail(next);

    var filterId = req.body.filterId; //过滤器ID
    var workStartTimeBegain = req.body.workStartTimeBegain; //工作时间 开始
    var workStartTimeEnd = req.body.workStartTimeEnd; //工作时间 结束
    var groupName = req.body.groupName; //用户组

    var filterJql = '';
    if (groupName && groupName.length > 0) {
        filterJql = 'worklogAuthor in (membersOf(' + groupName + '))';
        // worklogAuthor in (membersOf(DEV_Team1))
    }

    ep.all('getWorkData', function (getWorkData) {

        var userDataArray = [];
        var issueIds = []; //父任务Id
        getWorkData.forEach(function (issue) {
            // if (issue.fields.parent) {
            //     issueIds.push(issue.fields.parent.id);
            // }
            if (issue.fields.worklog) {
                var userData = {};
                var workLogs = [];
                workLogs = issue.fields.worklog.worklogs;
                var workLogsFilter = _.filter(workLogs, function (workLog) {
                    if (workStartTimeBegain != '' && workStartTimeEnd != '') {
                        return moment(workStartTimeBegain).isSameOrBefore(moment(workLog.started).format('L')) &&
                            moment(workStartTimeEnd).isSameOrAfter(moment(workLog.started).format('L'));
                    } else if (workStartTimeBegain != '') {
                        return moment(workStartTimeBegain).isSameOrBefore(moment(workLog.started).format('L'));
                    } else if (workStartTimeEnd != '') {
                        return moment(workStartTimeEnd).isSameOrAfter(moment(workLog.started).format('L'));
                    } else {
                        return true;
                    }
                });

                if (workLogsFilter.length > 0) {
                    workLogsFilter.forEach(function (workLogFilter) {
                        if (workLogFilter.author) {
                            userDataArray.push({
                                userName: workLogFilter.author.displayName,
                                timeSpentSeconds: workLogFilter.timeSpentSeconds
                            });
                        }
                    });
                }
            }
        });
         
        issueIds = _.uniq(issueIds);
        //处理父任务工作日志
        issue.getIssueWorkLogByIssueIds(issueIds, token, function (error, parentIssueWorkLog) {
            if (error) {
                logger.error(JSON.stringify(error));
            } else {
                var parentIssueWorkLogFilter = _.filter(parentIssueWorkLog, function (workLog) {
                    if (workStartTimeBegain != '' && workStartTimeEnd != '') {
                        return moment(workStartTimeBegain).isSameOrBefore(moment(workLog.started).format('L')) &&
                            moment(workStartTimeEnd).isSameOrAfter(moment(workLog.started).format('L'));
                    } else if (workStartTimeBegain != '') {
                        return moment(workStartTimeBegain).isSameOrBefore(moment(workLog.started).format('L'));
                    } else if (workStartTimeEnd != '') {
                        return moment(workStartTimeEnd).isSameOrAfter(moment(workLog.started).format('L'));
                    } else {
                        return true;
                    }
                });

                if (parentIssueWorkLogFilter.length > 0) {
                    parentIssueWorkLogFilter.forEach(function (worklog) {
                        var userData = {};
                        if (worklog.author) {
                            userDataArray.push({
                                userName: worklog.author.displayName,
                                timeSpentSeconds: worklog.timeSpentSeconds
                            });
                        }
                    });
                }

                var userDataArrayNew = _.groupBy(userDataArray, function (userData) {
                    return userData.userName;
                });

                var userDataArraySum = _.mapValues(userDataArrayNew, function (n) {

                    var timeSpentSeconds = 0;
                    n.forEach(function (obj) {
                        timeSpentSeconds = timeSpentSeconds + obj.timeSpentSeconds;
                    });

                    return {
                        timeSpentSeconds: timeSpentSeconds
                    };
                });

                var resultData = [];
                var userNameReport = [];
                var timeSpentSecondsReport = [];

                _.mapKeys(userDataArraySum, function (value, key) {
                    var obj = {};
                    obj.userName = key + '\n\n' + value.timeSpentSeconds / 3600;
                    obj.timeSpentSeconds = value.timeSpentSeconds / 3600;
                    resultData.push(obj);
                    return key;
                });

                //排序
                resultData = tools.sortObj(resultData, 'timeSpentSeconds', 'desc');
                var timeSpentSecondsSum = 0;

                resultData.forEach(function (obj) {
                    timeSpentSecondsSum = timeSpentSecondsSum + obj.timeSpentSeconds;
                    userNameReport.push(obj.userName);
                    timeSpentSecondsReport.push(obj.timeSpentSeconds);
                });

                var timeSpentSecondsAverage = userNameReport.length == 0 ? 0 : timeSpentSecondsSum / userNameReport.length;

                var result = {
                    userName: userNameReport,
                    timeSpent: timeSpentSecondsReport,
                    timeSpentSecondsAverage: _.ceil(timeSpentSecondsAverage, 2)
                };
                response.data = result;
                res.send(JSON.stringify(response));
            }
        })
    });

    filter.getDataByJql({
        filterId: filterId,
        filterJql: filterJql
    }, token, ep.done('getWorkData'));
}