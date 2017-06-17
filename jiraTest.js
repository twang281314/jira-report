/**
 * 
 * jria api test
 * 
 */

var Client = require('node-rest-client').Client;
var logger = require('./common/logger');
var jiraConnect = require('./common/jira-connect');

client = new Client();
// Provide user credentials, which will be used to log in to JIRA.
var loginArgs = {
    data: {
        "username": "wangtao",
        "password": "8002381"
    },
    headers: {
        "Content-Type": "application/json"
    }
};
/*
client.post("http://jira.iscs.com.cn/rest/auth/1/session", loginArgs, function (data, response) {
    if (response.statusCode == 200) {
        console.log('succesfully logged in, session:', data.session);
        var session = data.session;
        // Get the session information and store it in a cookie in the header
        var searchArgs = {
            headers: {
                // Set the cookie from the session information
                cookie: session.name + '=' + session.value,
                "Content-Type": "application/json"
            },
            data: {
                // Provide additional data for the JIRA search. You can modify the JQL to search for whatever you want.
                // jql: "type=Bug AND status=Closed"
                //username: 'wangtao'
                //since:'2016-09-20 00:00:00'
                ids: ['11509']
            }
        };
        var jiraUrl = 'rest/api/2/worklog/list';
        //jiraUrl='rest/api/2/worklog/updated';
        // Make the request return the search results, passing the header information including the cookie.
        client.get("http://jira.iscs.com.cn/" + jiraUrl, searchArgs, function (searchResult, response) {
            logger.info(searchResult);
            // console.log('status code:', response.statusCode);
            // console.log('search result:', searchResult);
        });
    } else {
        console.log(response);
    }
});

*/
// jiraConnect.jira(new Buffer("wangtao:8002381")
//         .toString("base64"))
//     .filter.getFavoriteFilters({}, function(error, result) {

//         if (error) {
//             logger.error(error);
//         } else {
//             logger.info(result);
//         }
//     }); //获取当前用户收藏的过滤器

// jiraConnect.jira(new Buffer("wangtao:8002381")
//         .toString("base64"))
//     .worklog.worklogList({
//         ids: ['17254','17263']
//     }, function (error, result) {

//         if (error) {
//             logger.error(error);
//         } else {
//             logger.info(JSON.stringify(result));
//         }
//     });

// jiraConnect.jira(new Buffer("wangtao:8002381")
//         .toString("base64"))
//     .issue.getIssue({
//         issueKey: 'XDW-1697'
//     }, function (error, result) {

//         if (error) {
//             logger.error(error);
//         } else {
//             logger.info(JSON.stringify(result));
//         }
//     });

// jiraConnect.jira(new Buffer("wangtao:8002381")
//         .toString('base64'))
//     .groups.findGroups({
//         query: 'D'
//     }, function (error, result) {
//         if (error) {
//             logger.error(error);
//         } else {
//             logger.info(JSON.stringify(result));
//         }
//     });


// jiraConnect.jira(new Buffer("wangtao:8002381")
//         .toString('base64'))
//     .user.searchPicker({
//         query: 'w'
//     }, function (error, result) {
//         if (error) {
//             logger.error(error);
//         } else {
//             logger.info(JSON.stringify(result));
//         }
//     });

// jiraConnect.jira(new Buffer("wangtao:8002381")
//     .toString('base64')).issue.assignIssue({
//     issueId: 13602,
//     assignee: "wangtao"
// }, function (error, result) {
//     if (error) {
//         logger.error(error);
//     } else {
//         logger.info(JSON.stringify(result));
//     }
// })

// jiraConnect.jira(new Buffer("wangtao:8002381")
//     .toString('base64')).worklog.getWorklogUpdated({
//     since: '1438013671562'
// }, function (error, result) {
//     if (error) {
//         logger.error(error);
//     } else {
//         logger.info(JSON.stringify(result));
//     }
// })

jiraConnect.jira(new Buffer("wangtao:8002381")
        .toString("base64"))
    .group.getUsersFromGroup({
        groupName: 'DEV_Team1'
    }, function (error, result) {

        if (error) {
            logger.error(error);
        } else {
            logger.info(JSON.stringify(result));
        }
    });