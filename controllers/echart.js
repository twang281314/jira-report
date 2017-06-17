/**
 * echart例子
 */
var config = require('../config');

exports.index = function(req, res, next) {

    res.render('pages/echart/index', {
        layout: 'layouts/index',
        bodyClass: 'skin-yellow',
        title: config.title
    });

}