/**
 * 缺陷统计报表
 */

var config = require('../config');
var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var _ = require('lodash');
var tools = require('../common/tools');
var filter = require('../models/filter');
var eventproxy = require('eventproxy');
var moment = require('moment');
moment.locale('zh-cn');

/**
 * 缺陷数量统计报表
 */
exports.index = function (req, res, next) {

    res.render('pages/bug/index', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        title: config.title
    });
}

/**
 * 缺陷状态统计报表
 */
exports.status = function (req, res, next) {

    res.render('pages/bug/status', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        title: config.title
    });
}

/**
 * 获取缺陷统计报表数据
 */
exports.getBugReportData = function (req, res, next) {

    var response = {
        success: true,
        data: {},
        msg: ""
    };
    var token = JSON.parse(req.cookies.cookie).token;
    var ep = new eventproxy();
    ep.fail(function (error) {
        response.success = false;
        response.msg = '出错了:' + JSON.stringify(error);
        res.send(response);
    });

    var filterId = req.body.filterId; //过滤器ID
    var reportType = req.body.reportType; //统计维度
    var bugCreatedTimeBegain = req.body.bugCreatedTimeBegain; //创建时间 开始
    var bugCreatedTimeEnd = req.body.bugCreatedTimeEnd; //创建时间 结束

    //"jql": "(issuetype = 内测缺陷（手工） OR issuetype = 内测缺陷（自动）) ",
    var fields = [
        "summary",
        "status",
        "assignee",
        "creator",
        "reporter",
        "created",
        "updated",
        "duedate"
    ];
    ep.all('getBugData', function (getBugData) {
        var bugReportArray = [];
        getBugData.forEach(function (issue) {

            //根据创建时间进行过滤
            if (bugCreatedTimeBegain &&
                moment(bugCreatedTimeBegain).isAfter(moment(issue.fields.created).format('L'))) {
                return false;
            }

            if (bugCreatedTimeEnd &&
                moment(bugCreatedTimeEnd).isBefore(moment(issue.fields.created).format('L'))) {
                return false;
            }

            bugReportArray.push({
                reporter: issue.fields.reporter ? issue.fields.reporter.displayName : '未分配',
                assignee: issue.fields.assignee ? issue.fields.assignee.displayName : '未分配',
                status: issue.fields.status.name,
                created: issue.fields.created
            });
        });

        var bugReportArrayGroup = _.groupBy(bugReportArray, function (userData) {
            return userData[reportType];
        });

        var reportData = [];
        var userName = [];
        var bugSum = [];

        _.forEach(bugReportArrayGroup, function (n, key) {
            reportData.push({
                userName: key,
                bugSum: n.length
            });
        });

        //排序
        reportData = tools.sortObj(reportData, 'bugSum', 'desc');

        reportData.forEach(function (item) {
            userName.push(item.userName);
            bugSum.push(item.bugSum);
        });

        response.data = {
            userName: userName,
            bugSum: bugSum
        }
        res.send(response);
    });

    filter.getDataByJql({
        filterId: filterId,
        filterJql: '',
        fields: fields
    }, token, ep.done('getBugData'));
}

/**
 * 获取缺陷状态统计报表数据
 */
exports.getBugStatusReportData = function (req, res, next) {

    var response = {
        success: true,
        data: {},
        msg: ''
    };

    var token = JSON.parse(req.cookies.cookie).token;
    var ep = new eventproxy();
    ep.fail(function (error) {
        response.success = false;
        response.msg = '出错了:' + JSON.stringify(error);
        res.send(response);
    });

    var filterId = req.body.filterId; //过滤器ID
    var bugCreatedTimeBegain = req.body.bugCreatedTimeBegain; //创建时间 开始
    var bugCreatedTimeEnd = req.body.bugCreatedTimeEnd; //创建时间 结束

    var fields = [
        "status",
        "created"
    ];

    ep.all('getBugStatusData', function (getBugStatusData) {
        var bugStatusReportArray = [];
        getBugStatusData.forEach(function (item) {

            //根据创建时间进行过滤
            if (bugCreatedTimeBegain &&
                moment(bugCreatedTimeBegain).isAfter(moment(item.fields.created).format('L'))) {
                return false;
            }

            if (bugCreatedTimeEnd &&
                moment(bugCreatedTimeEnd).isBefore(moment(item.fields.created).format('L'))) {
                return false;
            }

            bugStatusReportArray.push({
                id: item.fields.status.id,
                name: _.trim(_.trim(item.fields.status.name, ']'), '['),
                created: item.fields.created
            });
        });

        var bugStatusReportArrayGroup = _.groupBy(bugStatusReportArray, function (bugStatus) {
            return bugStatus.name;
        });
        var reportData = [];
        var statusName = [];
        var bugSum = [];
        _.forEach(bugStatusReportArrayGroup, function (n, key) {
            reportData.push({
                name: key,
                value: n.length
            });
        });

        //排序
        reportData = tools.sortObj(reportData, 'value', 'desc');

        reportData.forEach(function (item) {
            statusName.push(item.name);
            bugSum.push(item.value);
        });

        response.data = {
            pieData: reportData, //饼图数据源
            statusName: statusName,
            bugSum: bugSum
        }
        res.send(response);
    });

    filter.getDataByJql({
        filterId: filterId,
        filterJql: '',
        fields: fields
    }, token, ep.done('getBugStatusData'));

}