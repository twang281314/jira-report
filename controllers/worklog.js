/**
 * 工作日志统计报表
 */

var config = require('../config');
var eventproxy = require('eventproxy');
var moment = require('moment');
moment.locale('zh-cn');
var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var worklog = require('../models/worklog');
var user = require('../models/user');
var _ = require('lodash');
var tools = require('../common/tools');

exports.index = function (req, res, next) {

    res.render('pages/worklog/index', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        username: JSON.parse(req.cookies.cookie).username,
        title: config.title
    });
}

exports.getWorkLogReportData = function (req, res, next) {

    var ep = new eventproxy();

    var userNameSet = new Set(); //利用Set成员值的唯一性存放用户名
    var dataSet = [];

    var columns = [{
        title: "用户名",
        data: 'displayName'
    }, {
        title: '∑',
        data: 'spendSum'
    }]

    var columnDefs = [{
        "targets": [0],
        "type": 'name'
    }, {
        "targets": [1],
        "type": 'sum'
    }];

    var token = JSON.parse(req.cookies.cookie).token;
    var response = {
        success: true,
        data: {},
        msg: ""
    };

    ep.fail(function (error) {
        response.success = false;
        response.msg = "出错了,错误信息:" + JSON.stringify(error);
        res.send(response);
    });

    var userName = req.body.userName; //用户名
    var workStartTimeBegain = req.body.workStartTimeBegain; //工作时间 开始
    var workStartTimeEnd = req.body.workStartTimeEnd || moment(); //工作时间 结束
    var groupName = req.body.groupName; //用户组

    if (!workStartTimeBegain) {
        response.success = false;
        response.msg = "请输入查询的开始时间";
        res.send(response);
        return;
    }

    ep.all('getWorklogUpdated', 'getUserListByGroupName', function (getWorklogUpdated, getUserListByGroupName) {

        var ids = [];
        getWorklogUpdated.forEach(function (item) {
            ids.push(item.worklogId);
        });

        worklog.getWorkLogsByIds(token, ids, function (error, result) {
            var workLogs = [];
            result.forEach(function (item) {
                //先对前端条件进行过滤
                if (!item.author) {
                    return false;
                }
                if (userName && item.author.name != userName) {
                    return false;
                }

                if (getUserListByGroupName && getUserListByGroupName.length > 0) {

                    if (_.findIndex(getUserListByGroupName, function (group) {
                            return group.name == item.author.name;
                        }) < 0) {
                        return false;
                    }

                }
                //符合条件的进行处理
                var obj = {};
                obj.name = item.updateAuthor.name;
                obj.avatarUrl = item.author.avatarUrls['16x16'];
                obj.displayName = item.author.displayName;
                obj.comment = item.comment;
                obj.updated = item.updated;
                obj.started = moment(item.started).format('L');
                obj.timeSpendSeconds = item.timeSpentSeconds;
                obj.worklogId = item.id;
                obj.issueId = item.self.match(/issue\/([^\/worklog]+)/)[0].replace('issue/', '');
                workLogs.push(obj);
                userNameSet.add(item.author.displayName);
            });

            userNameSet.forEach(function (item) {
                dataSet.push({
                    'displayName': item,
                    'spendSum': 0
                });
            });

            var workLogsGroupByStarted = _.groupBy(workLogs, function (worklog) {
                return worklog.started;
            });

            workLogsGroupByStarted = _.mapValues(workLogsGroupByStarted, function (n) {
                return _.groupBy(n, function (user) {
                    return user.displayName;
                });
            });

            do {
                var dateObj = {};
                var dataKey = 'date' + moment(workStartTimeBegain).format('L').replace(/-/g, '_');
                dateObj.data = dataKey + '.spentTime';
                dateObj.className = dataKey;
                dateObj.title = moment(workStartTimeBegain).format('L'); //+'<br>'+moment(workStartTimeBegain).format('dddd')
                dateObj.type = 'num';
                columns.push(dateObj);
                columnDefs.push({
                    targets: [columnDefs.length],
                    type: 'date',
                    columnName: dataKey
                });

                var workLogsDate = workLogsGroupByStarted[dateObj.title];
                if (!workLogsDate) {
                    workLogsDate = [];
                }
                dataSet.forEach(function (item) {
                    item[dataKey] = {
                        spentTime: '',
                        details: []
                    };
                    var spentTime = 0;
                    if (workLogsDate[item.displayName]) {
                        workLogsDate[item.displayName].forEach(function (workLogDateItem) {
                            spentTime += workLogDateItem.timeSpendSeconds;
                            item[dataKey].details.push({
                                timeSpendSeconds: workLogDateItem.timeSpendSeconds / 3600,
                                issueId: workLogDateItem.issueId,
                                comment: workLogDateItem.comment,
                                updated: workLogDateItem.updated
                            });
                        });
                        item[dataKey].spentTime = spentTime / 3600;
                        item.spendSum += spentTime / 3600;
                        item.avatarUrl = workLogsDate[item.displayName][0].avatarUrl;
                    }
                });
                workStartTimeBegain = moment(workStartTimeBegain).add(1, 'days');
            } while (moment(workStartTimeBegain).isSameOrBefore(workStartTimeEnd));

            response.data.data = dataSet;
            response.data.columns = columns;
            response.data.columnDefs = columnDefs;
            res.send(response);
        });
    });

    //根据时间 获取workLog 的ids
    worklog.getWorkLogIdsByUpdatedTime(
        token,
        moment(req.body.workStartTimeBegain).add(-5, 'd').format('x'), [],
        ep.done('getWorklogUpdated'));
    user.getUserListByGroupNameFromJson(token, groupName, ep.done('getUserListByGroupName'));
}

/**
 * 工作量统计报表
 * 之前使用jql查询任务后 通过任务中worklog来进行统计
 * 现在改为直接通过工作日志接口
 */
exports.getWorkReportData = function (req, res, next) {
    var ep = new eventproxy();
    var token = JSON.parse(req.cookies.cookie).token;
    var response = {
        success: true,
        data: {},
        msg: ""
    };

    ep.fail(function (error) {
        response.success = false;
        response.msg = "出错了,错误信息:" + JSON.stringify(error);
        res.send(response);
    });

    var workStartTimeBegain = req.body.workStartTimeBegain; //工作时间 开始
    var workStartTimeEnd = req.body.workStartTimeEnd || moment(); //工作时间 结束
    var groupName = req.body.groupName; //用户组

    if (!workStartTimeBegain) {
        response.success = false;
        response.msg = "请输入查询的开始时间";
        res.send(response);
        return;
    }

    ep.all('getWorklogUpdated', 'getUserListByGroupName', function (getWorklogUpdated, getUserListByGroupName) {
        var ids = [];
        getWorklogUpdated.forEach(function (item) {
            ids.push(item.worklogId);
        });

        worklog.getWorkLogsByIds(token, ids, function (error, result) {
            var workLogs = [];
            result.forEach(function (item) {
                //先对前端条件进行过滤

                if (!item.author) {
                    return false;
                }
                if (getUserListByGroupName && getUserListByGroupName.length > 0) {

                    if (_.findIndex(getUserListByGroupName, function (group) {
                            return group.name == item.author.name;
                        }) < 0) {
                        return false;
                    }
                }
                //符合条件的进行处理
                workLogs.push({
                    userName: item.author.displayName,
                    started: item.started,
                    timeSpentSeconds: item.timeSpentSeconds
                });
            });

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

            var userDataArrayNew = _.groupBy(workLogsFilter, function (userData) {
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
        });
    });

    //根据时间 获取workLog 的ids
    worklog.getWorkLogIdsByUpdatedTime(
        token,
        moment(req.body.workStartTimeBegain).add(-5, 'd').format('x'), [],
        ep.done('getWorklogUpdated'));
    user.getUserListByGroupNameFromJson(token, groupName, ep.done('getUserListByGroupName'));
}