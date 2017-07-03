var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var routes = require('./routes/index');
var dataAccess = require('dataAccess');
var app = express();
dataAccess.setPoolConfig(require('./mysql.json'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/demo')));
app.use(session({
    secret: 'dba33790a226395f55e13515df997e4621724730a59746dba5733919b641417d2aa57' +
    'b155ffba419a2fce7822aed6a2c71dc6dc8723fe930f8e080cb174cf7d23be3306103c97ab628541da1c00bbab932f4' +
    '1b5e0c918cef6e8f3417544adb7ff7033b590100d8ca24a6c031589420ade917122aa65de884e48cdce358608acc', // 建议使用 128 个字符的随机字符串
    cookie: { maxAge: 10 * 60 * 1000 }
}));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
