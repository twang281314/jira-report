/**
 * 公共api数据
 */

var config = require('../config');
var eventproxy = require('eventproxy');
var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var issue = require('../models/issue');
var user = require('../models/user');
var moment = require('moment');
moment.locale('zh-cn');
var worklog = require('../models/worklog');
var _ = require('lodash');
var tools = require('../common/tools');


//获取用户组数据
exports.getGroupList = function (req, res, next) {

    var token = JSON.parse(req.cookies.cookie).token;
    var data = [];
    jiraConnect.jira(token).groups.findGroups({}, function (error, result) {
        if (error) {
            logger.info(JSON.stringify(error));
        } else {
            result.groups.forEach(function (group) {
                var item = {};
                item.id = group.name;
                item.text = group.name;
                data.push(item);
            });
            res.send(JSON.stringify(data));
        }
    });
}

//获取当前用户收藏的过滤器
exports.getFavoriteFilters = function (req, res, next) {

    var ep = new eventproxy();
    ep.fail(function (error) {
        response.success = false;
        response.msg = '出错了,错误信息:' + JSON.stringify(error);
        res.send(response);
    });
    ep.all('getFilter', function (getFilter) {
        var data = [];
        getFilter.forEach(function (filter) {
            var item = {};
            item.id = filter.id;
            item.text = filter.name;
            data.push(item);
        });
        res.send(JSON.stringify(data));
    });
    jiraConnect.jira(JSON.parse(req.cookies.cookie).token).filter.getFavoriteFilters({}, ep.done('getFilter')); //获取当前用户收藏的过滤器
}

//获取用户数据
exports.getUserList = function (req, res, next) {

    var response = {};
    var token = JSON.parse(req.cookies.cookie).token;
    var search = {
        query: ''
    };

    search.query = req.query.q;
    jiraConnect.jira(token).user.searchPicker(search, function (error, result) {

        if (error) {
            response.success = false;
            response.msg = '出错了,错误信息:' + JSON.stringify(error);
            res.send(response);
        } else {
            response.items = result.users;
            response.items.forEach(function (item) {
                item.id = item.key;
            });
            response.total = result.total;
            res.send(JSON.stringify(response));
        }
    });
}

/**
 * 根据issueIds获取issueKeys
 */
exports.getIssueKeysByIssueIds = function (req, res, next) {

    var response = {
        success: true,
        data: {},
        msg: ''
    };
    var token = JSON.parse(req.cookies.cookie).token;
    var issueIds = req.body.issueIds;

    issue.getIssueKeysByIssueIds(token, issueIds.split(','), function (error, result) {

        if (error) {
            response.success = false;
            response.msg = '出错了,错误信息:' + JSON.stringify(error);
            res.send(response);
        } else {
            response.data = result;
            res.send(response);
        }
    });
}

/**
 * 更新用户组 下面用户数据
 * 由于通过用户组获取用户需要admin权限
 * 此方法供有管理员权限的人手动同步用户组数据
 * 会将结果保存到本地文件json 其他没有权限的人直接使用json数据
 */
exports.updateGroupUserListData = function (req, res, next) {

    var response = {
        success: true,
        data: {},
        msg: ''
    };
    var token = JSON.parse(req.cookies.cookie).token;
    var groupName = req.body.groupName;

    user.updateUserListByGroupName(token, groupName, function (error, data) {

        if (error) {
            response.success = false;
            response.msg = error;
            res.send(response);
        } else {
            response.msg = '同步成功';
            res.send(response);
        }
    });
}

/**
 * 获取当前登录用户最近30天日志报表数据
 */
exports.getWorklogDataByUserName = function (req, res, next) {

    var ep = new eventproxy();
    var token = JSON.parse(req.cookies.cookie).token;
    var userName = JSON.parse(req.cookies.cookie).username;
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

    var workStartTimeBegain = moment().add(-30, 'd'); //工作时间 开始
    var workStartTimeEnd = moment(); //工作时间 结束

    ep.all('getWorklogUpdated', function (getWorklogUpdated) {
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

                if (item.author.name != userName) {
                    return false;
                }

                if (moment(workStartTimeBegain).isAfter(moment(item.started))) {
                    return false;
                }

                if (moment(workStartTimeEnd).isBefore(moment(item.started))) {
                    return false;
                }
                //符合条件的进行处理
                workLogs.push({
                    started: moment(item.started).format('L'),
                    timeSpentSeconds: item.timeSpentSeconds
                });
            });

            var dateArray = [];
            do {
                dateArray.push(moment(workStartTimeBegain).format('L'));
                workStartTimeBegain = moment(workStartTimeBegain).add(1, 'days');
            } while (moment(workStartTimeBegain).isSameOrBefore(workStartTimeEnd));

            dateArray.forEach(function (item) {
                workLogs.push({
                    started: item,
                    timeSpentSeconds: 0
                });
            });

            var workLogsGroup = _.groupBy(workLogs, function (userData) {
                return userData.started;
            });

            var workLogsSum = _.mapValues(workLogsGroup, function (n) {

                var timeSpentSeconds = 0;
                n.forEach(function (obj) {
                    timeSpentSeconds = timeSpentSeconds + obj.timeSpentSeconds;
                });

                return {
                    timeSpentSeconds: timeSpentSeconds
                };
            });


            var reportData = [];
            _.mapKeys(workLogsSum, function (value, key) {
                reportData.push({
                    started: key,
                    timeSpentHours: value.timeSpentSeconds / 3600
                });
                return key;
            });

            reportData = tools.sortObj(reportData, 'started', 'asc');
            var reportDataArray = [];
            _.forEach(reportData, function (value, key) {
                var array = [];
                array.push(value.started);
                array.push(value.timeSpentHours);
                reportDataArray.push(array);
            });

            response.data = reportDataArray;
            res.send(response);
        });
    });

    //根据时间 获取workLog 的ids
    worklog.getWorkLogIdsByUpdatedTime(
        token,
        moment(workStartTimeBegain).add(-5, 'd').format('x'), [],
        ep.done('getWorklogUpdated'));

}