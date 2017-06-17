/*!
 * 路由模块
 */

var express = require('express');
var site = require('./controllers/site');
var echart = require('./controllers/echart');
var work = require('./controllers/work');
var story = require('./controllers/story'); //故事冲刺进度
var teamport = require('./controllers/teamport'); //Team冲刺进度
var worklog = require('./controllers/worklog'); //工作日志统计
var api = require('./controllers/api');
var setting = require('./controllers/setting');
var bug = require('./controllers/bug');

var router = express.Router();
var config = require('./config');
var auth = require('./middlewares/auth');

//视图
router.get('/', auth.userRequired, site.index);
router.get('/login', site.login);
router.get('/logout', site.logout);
router.get('/echart', auth.userRequired, echart.index);
router.get('/work', auth.userRequired, work.index);
router.get('/storyProgress', auth.userRequired, story.story); //故事冲刺进度
router.get('/teamProgress', auth.userRequired, teamport.teamProgress); //Team冲刺进度
router.get('/lineGraph', auth.userRequired, story.lineGraph); //Team冲刺进度
router.get('/worklog', auth.userRequired, worklog.index);
router.get('/setting', auth.userRequired, setting.index);
router.get('/bug', auth.userRequired, auth.userRequired, bug.index);
router.get('/bugStatus', auth.userRequired, auth.userRequired, bug.status);

//公共接口
router.post('/doLogin', site.doLogin); //登录验证接口
router.get('/api/getFavoriteFilters', auth.userRequired, api.getFavoriteFilters); //获取用户收藏的过滤器
router.get('/api/getGroupList', auth.userRequired, api.getGroupList); //获取用户组数据
router.get('/api/getUserList', auth.userRequired, api.getUserList); //获取用户数据
router.post('/api/getIssueKeysByIssueIds', auth.userRequired, api.getIssueKeysByIssueIds); //获取用户数据
router.post('/api/updateGroupUserListData', auth.userRequired, api.updateGroupUserListData); //同步用户组数据
router.get('/api/getWorklogDataByUserName', api.getWorklogDataByUserName); //获取指定用户日志数据

//页面ajax业务接口
router.post('/api/getWorkReportData', auth.userRequired, worklog.getWorkReportData);
router.post('/api/getAllWorkReportData', auth.userRequired, work.getAllWorkReportData);
router.post('/api/getStoryReportData', auth.userRequired, story.getStoryReportData); //故事冲刺进度
router.post('/api/getTeamReportData', auth.userRequired, teamport.getTeamReportData); //Team冲刺进度
router.post('/api/getDashboardReportData', auth.userRequired, story.getDashboardReportData); //3Team进度
router.post('/api/getWorkLogReportData', auth.userRequired, worklog.getWorkLogReportData);
router.post('/api/getBugReportData', auth.userRequired, bug.getBugReportData); //缺陷统计
router.post('/api/getBugStatusReportData', auth.userRequired, bug.getBugStatusReportData); //缺陷状态统计


module.exports = router;