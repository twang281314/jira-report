var express = require('express');
var path = require('path');
var hbs = require('hbs'); //视图引擎
var favicon = require('serve-favicon');
var logger = require('./common/logger'); //日志打印
var config = require('./config');
var errorPageMiddleware = require('./middlewares/error_page');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


var route = require('./route');

var app = express();


// 注册视图引擎
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'hbs');
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.set('view cache', false);//暂时禁用缓存

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));

// 通用的中间件
app.use(require('response-time')()); //响应时间头
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(errorPageMiddleware.errorPage);
app.use(cookieParser())

app.use('/', route);

// register partials
hbs.registerPartials(__dirname + '/views/partials');


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.render('notify/404.html', {
    title: 'No Found'
  })
});

app.listen(4000, function() {
  logger.info('You can debug your app with http://' + config.hostname + ':' + config.port);
});