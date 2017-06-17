/**
 * 
 * jiangdeqi 专用
 * **/
var config = require('../config');
var eventproxy = require('eventproxy');
var jiraConnect = require('../common/jira-connect');

/** 故事冲刺进度 **/
exports.story = function(req, res, next) {
    //加载页面模板
    res.render('pages/storyProgress/index', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        username: JSON.parse(req.cookies.cookie).username,
        title: config.title
    });
};


//请求JIRA接口-故事冲刺进度
exports.getStoryReportData = function(req, res, next) {
    var ep = new eventproxy();
    ep.fail(next);
    var filterId = req.body.filterId; //过滤器ID
    ep.all('postData', function(getFilter) {

        var xAxis = [];
        var series = [];

        getFilter.issues.sort(function(a, b) {
            return b.fields.aggregateprogress.percent - a.fields.aggregateprogress.percent
        });
        //拼装数据
        getFilter.issues.forEach(function(item, index) {
            if (item.fields.aggregateprogress.percent == undefined) {
                item.fields.aggregateprogress.percent = 0;
            }
            
            //名称拼接
            if (index == 0) {
                xAxis += item.fields.summary + item.key + item.fields.status.name + '[进度' + item.fields.aggregateprogress.percent + '%]';
            } else {
                xAxis += "," + item.fields.summary + item.key + item.fields.status.name + '[进度' + item.fields.aggregateprogress.percent + '%]';
            }
            
            mund = parseInt(item.fields.aggregateprogress.percent);
            //已完成的显示绿色柱形图
            if (item.fields.status.name == '[已完成]') {
                series.push({
                    value: mund,
                    itemStyle: {
                        normal: {color: '#6CB000',label : {show: true }}
                    }
                });
            } else {
                series.push({
                    value: mund,
                    itemStyle: {
                        normal: {color: '#666',label : {show: true }}
                    }
                });
            }
        });
        arr = xAxis.split(",");
        //返回数据
        res.send({
            "code": 0,
            "xAxisd": arr,
            "seriesd": series
        });
    });
    //请求模板
    jiraConnect.jira(JSON.parse(req.cookies.cookie).token).search.search({
        "jql": "filter=" + filterId,
        "startAt": 0,
        "maxResults": 100,
        "fields": [
            "summary",
            "status",
            "assignee",
            "aggregateprogress",
            "aggregatetimeestimate"
        ],
        "fieldsByKeys": false
    }, ep.done('postData'));
}



/**
 * 
 * lineGraph
 */
//3个TEAM燃尽图
exports.lineGraph = function(req, res, next) {
    //加载页面模板
    res.render('pages/lineGraph/line-graph', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        username: JSON.parse(req.cookies.cookie).username,
        title: config.title
    });
};



//请求JIRA接口-3team进度
exports.getDashboardReportData = function(req, res, next) {
    var ep = new eventproxy();
    ep.fail(next);
    var dashboardId = req.body.filterId; //过滤器ID

    ep.all('postData', function(dashboard) {
        //返回数据
        res.send(dashboard);
    });

    //请求模板
    jiraConnect.jira(JSON.parse(req.cookies.cookie).token).search.search({
        "sprintId": dashboardId,
        "rapidViewId": 233,
        "statisticFieldId": "field_customfield_10109",
        "startAt": 0,
        "maxResults": 30,
        "_": 1474679550069
    }, ep.done('postData'));

}