var config = require('../config');
var eventproxy = require('eventproxy');
var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var tools = require('../common/tools');
var _ = require('lodash');


/** 
 * Team冲刺进度
 */
exports.teamProgress = function(req, res, next) {
    //StoryProgress
    res.render('pages/teamProgress/team-progress', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        username: JSON.parse(req.cookies.cookie).username,
        title: config.title
    });
};

//Team冲刺进度
exports.getTeamReportData = function(req, res, next) {
    var ep = new eventproxy();
    ep.fail(next);
    var filterId = req.body.filterId; //过滤器ID
    ep.all('postData', function(getFilter) {
        //方法一
        // var map = {},
        //     dest = [];
        // //按team对原数据进行分类整理
        // for (var i = 0; i < getFilter.issues.length; i++) {
        //     var ai = getFilter.issues[i];
        //     if (!map[ai.fields.customfield_10901.value]) {
        //         dest.push({
        //             id: ai.fields.customfield_10901.value,
        //             data: [ai],
        //             pvalue: 0,//已完成进度
        //             tvalue: 0,//总进度
        //             pointvalueall: 0,//各个team总故事点
        //             pointvaluefinish: 0,//已完成总故事点
        //         });
        //         map[ai.fields.customfield_10901.value] = ai;
        //     } else {
        //         for (var j = 0; j < dest.length; j++) {
        //             var dj = dest[j];
        //             if (dj.id == ai.fields.customfield_10901.value) {
        //                 dj.data.push(ai);
        //                 break;
        //             }
        //         }
        //     }
        // };
        // //按某个字段进行排序
        // var by = function(name, minor) {
        //     return function(o, p) {
        //         var a, b;
        //         if (o && p && typeof o === 'object' && typeof p === 'object') {
        //             a = o[name];
        //             b = p[name];
        //             if (a === b) {
        //                 return typeof minor === 'function' ? minor(o, p) : 0;
        //             }
        //             if (typeof a === typeof b) {
        //                 return a < b ? -1 : 1;
        //             }
        //             return typeof a < typeof b ? -1 : 1;
        //         } else {
        //             thro("error");
        //         }
        //     }
        // }
        // //数据处理
        // var xAxis = [];
        // var progressall = [];
        // var storypoint = [];
        // dest.sort(by('id')).forEach(function(item, index) {
        //     item.data.forEach(function(ite) {
        //         item.pvalue += ite.fields.aggregateprogress.progress;
        //         item.tvalue += ite.fields.aggregateprogress.total;
        //         item.pointvalueall += ite.fields.customfield_10002;
        //         if (ite.fields.status.name == "[已完成]") {
        //             item.pointvaluefinish += ite.fields.customfield_10002;
        //         }
        //     })
        //     var progressvalue = item.pvalue / item.tvalue * 100;//计算进度
        //     progressall.push(parseInt(progressvalue));
        //     var storypointvalue = item.pointvaluefinish / item.pointvalueall * 100;//计算故事点完成情况
        //     storypoint.push(parseInt(storypointvalue));
        //     if (index == 0) {
        //         xAxis += item.id;
        //     } else {
        //         xAxis += "," + item.id;
        //     }
        // });
        // var teamarr = xAxis.split(",");


        //方法二
        var teamDataArray = [];
        getFilter.issues.forEach(function(issue) {
            var teamData = {};
            if (issue.fields.customfield_10901 != null) {
                teamData.teamName = issue.fields.customfield_10901.value; //team名
                teamData.pvalue = issue.fields.aggregateprogress.progress; //已完成进度
                teamData.tvalue = issue.fields.aggregateprogress.total; //总进度
                teamData.pointvalueall = issue.fields.customfield_10002; //故事点
                teamData.pointstorystate = issue.fields.status.name; //状态 已完成 进行中等
                teamDataArray.push(teamData);
            } else {
                teamData.teamName = null; //team名
                teamData.pvalue = issue.fields.aggregateprogress.progress; //已完成进度
                teamData.tvalue = issue.fields.aggregateprogress.total; //总进度
                teamData.pointvalueall = issue.fields.customfield_10002; //故事点
                teamData.pointstorystate = issue.fields.status.name; //状态 已完成 进行中等
                teamDataArray.push(teamData);
            }
        });

        var teamDataArrayNew = _.groupBy(teamDataArray, function(teamData) {
            return teamData.teamName;
        });
        var teamDataArraySum = _.mapValues(teamDataArrayNew, function(n) {
            var pvalue = 0;
            var tvalue = 0;
            var pointvalueall = 0;
            var progressvalue = 0;
            var pointvaluefinsh = 0;
            n.forEach(function(obj) {
                pvalue = pvalue + obj.pvalue;
                tvalue = tvalue + obj.tvalue;
                progressvalue = pvalue / tvalue * 100;
                pointvalueall = pointvalueall + obj.pointvalueall;
            });
            n.forEach(function(obj) {
                if (obj.pointstorystate == '[已完成]') {
                    pointvaluefinsh = pointvaluefinsh + obj.pointvalueall;
                }
            });
            var storypointvalue = pointvaluefinsh / pointvalueall * 100;
            return {
                progressvalue: progressvalue,
                storypointvalue: storypointvalue
            };
        });

        //定义数组 构建echart报表数据源
        var resultData = [];
        var teamarr = [];
        var progressall = [];
        var storypoint = [];
        _.mapKeys(teamDataArraySum, function(value, key) {
            var obj = {};
            //  obj.teamName = key;
            obj.teamName = key + '\n\n' + 'Team进度:　' + parseInt(value.progressvalue) + '%' + '\n\n' + '　故事完成率:　' + parseInt(value.storypointvalue) + '%';
            obj.progressvalue = value.progressvalue;
            obj.storypointvalue = value.storypointvalue;
            resultData.push(obj);
            return key;
        });
        resultData = tools.sortObj(resultData, 'progressvalue', 'desc');
        resultData.forEach(function(obj) {
            teamarr.push(obj.teamName);
            progressall.push(parseInt(obj.progressvalue));
            storypoint.push(parseInt(obj.storypointvalue));
        });
        res.send({
            // "code": 0,
            "xAxisd": teamarr,
            "seriesdprogress": progressall,
            "seriesdstory": storypoint,
        });
    });

    jiraConnect.jira(JSON.parse(req.cookies.cookie).token).search.search({
        "jql": "filter=" + filterId,
        "startAt": 0,
        "maxResults": 1000,
        "fields": [
            "summary",
            "status",
            "aggregateprogress",
            "aggregatetimeestimate",
            "customfield_10901",
            "customfield_10002"
        ],
        "fieldsByKeys": false
    }, ep.done('postData'));
}