var config = require('../config');

exports.index = function (req, res, next) {

    res.render('pages/setting/index', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        username: JSON.parse(req.cookies.cookie).username,
        title: config.title
    });
}