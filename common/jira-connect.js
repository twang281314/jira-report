/**
 * jira rest api connect
 */

var JiraClient = require('./jira-connector');

function jira(auth) {

    return new JiraClient({
        host: 'jira.iscs.com.cn',
        protocol: 'http',
        basic_auth: {
            base64: auth
                //base64: new Buffer("wangtao:8002381").toString("base64")
                // username: 'wangtao',
                // password: '0000000'
        }
    });
}

// var jira = new JiraClient({
//     host: 'jira.iscs.com.cn',
//     protocol: 'http',
//     basic_auth: {
//         base64: new Buffer("wangtao:8002381").toString("base64")
//             // username: 'wangtao',
//             // password: '0000000'
//     }
// });

exports.jira = jira;