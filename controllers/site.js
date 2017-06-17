/*!
 * site index controller.
 */


/**
 * Module dependencies.
 */

var config = require('../config');
var eventproxy = require('eventproxy');
var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var restClient = require('node-rest-client').Client;
var authMiddleWare = require('../middlewares/auth');

exports.index = function(req, res, next) {

    var username = JSON.parse(req.cookies.cookie).username;

    res.render(
        'pages/index', {
            layout: 'layouts/index',
            bodyClass: 'skin-yellow',
            title: config.title,
            username: username,
            getProject: ''
        }
    );
}

exports.test = function(req, res, next) {

    var ep = new eventproxy();

    ep.fail(next);

    ep.all('getFilter', function(getFilter) {
        var data = [];
        getFilter.forEach(function(filter) {
            var item = {};
            item.id = filter.id;
            item.text = filter.name;
            data.push(item);
        });
        res.send(JSON.stringify(data));
    });

    //jiraConnect.filter.getFavoriteFilters({}, ep.done('getFilter')); //获取当前用户收藏的过滤器
    jiraConnect.jira(JSON.parse(req.cookies.cookie).token).filter.getFavoriteFilters({}, ep.done('getFilter')); //获取当前用户收藏的过滤器

    // jiraConnect.search.search({
    //     "jql": "project = XDW AND issuetype in (任务, 子任务) AND Sprint = 302 ORDER BY summary DESC, status ASC, Rank ASC",
    //     "startAt": 0,
    //     "maxResults": 1,
    //     "fields": [
    //         "summary",
    //         "status",
    //         "assignee"
    //     ],
    //     "fieldsByKeys": false
    // }, ep.done('getProject'));
}

//登录
exports.login = function(req, res, next) {
    res.render('pages/site/login');
}

//注销
exports.logout = function(req, res, next) {
    res.clearCookie('cookie', {
        path: '/'
    });
    res.redirect('/login');
}

//登录验证接口  调用jira接口
exports.doLogin = function(req, res, next) {

    var username = req.body.username;
    var password = req.body.password;

    var result = {
        success: true,
        msg: '登录成功'
    };

    var client = new restClient();

    var loginArgs = {
        data: {
            "username": username,
            "password": password
        },
        headers: {
            "Content-Type": "application/json"
        }
    };

    //调用jira验证接口
    client.post("http://" + config.jiraHost + "/rest/auth/1/session", loginArgs, function(data, response) {
        if (response.statusCode == 200) {
            // result.token = data.session.name + '=' + data.session.value;
            result.token = new Buffer(username + ':' + password).toString("base64");
            result.username = username;
            authMiddleWare.gen_session(result, res); //保存cookie
            res.send(JSON.stringify(result));
        } else if (response.statusCode = 401) {
            result.success = false;
            result.msg = '帐号或密码错误';
            res.send(JSON.stringify(result));
        } else {
            result.success = false;
            result.msg = '未知错误,请联系管理员';
            res.send(JSON.stringify(result));
        }
    });

}