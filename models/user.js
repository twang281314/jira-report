/**
 * 用户模块
 */

var jiraConnect = require('../common/jira-connect');
var logger = require('../common/logger');
var fs = require('fs');

/**
 * 根据用户组名称获取用户
 * 接口需要sysadmin or admin 权限
 */
function updateUserListByGroupName(token, groupName, callback) {

    if (!groupName) {
        callback('请指定用户组');
    } else {
        jiraConnect.jira(token).group.getUsersFromGroup({
            groupName: groupName,
            startAt: 0,
            maxResults: 1000
        }, function (error, result) {
            if (error) {
                callback('调用jira接口出错,'+JSON.stringify(error));
            } else {
                fs.writeFile('./data/' + groupName + '.json', JSON.stringify(result), function (error, data) {

                    if (error) {
                        callback('保存出错,' + error);
                    } else {
                        callback(null, 'success');
                    }
                })
            }
        });
    }
}

/**
 * 
 * 直接从json获取结果
 * 解决权限问题
 */
function getUserListByGroupNameFromJson(token, groupName, callback) {

    if (!groupName) {
        callback(null, []);
    } else {
        fs.readFile('./data/' + groupName + '.json', function (error, data) {

            if (error) {
                callback('获取用户列表失败,请联系管理员' + error);
            } else {
                callback(null, JSON.parse(data).values);
            }
        });
    }
}

exports.updateUserListByGroupName = updateUserListByGroupName;
exports.getUserListByGroupNameFromJson = getUserListByGroupNameFromJson;