/**
 *  验证中间件
 */

function gen_session(user, res) {
    var cookie = {};
    cookie.username = user.username;
    cookie.token = user.token;
    var opts = {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true
    };
    res.cookie('cookie', JSON.stringify(cookie), opts); //cookie 有效期30天
}

exports.gen_session = gen_session;


/**
 * 需要登录
 */
exports.userRequired = function(req, res, next) {

    if (!req.cookies || !req.cookies.cookie || !JSON.parse(req.cookies.cookie).token) {
       return res.redirect('/login'); //直接跳转到登录页面
    }

    next();
};