var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// use cookies for session data for now
var session = require('cookie-session');

var routes = require('./routes/index');

// global utils
global.app_require = function(name){
    return require(path.join(__dirname,name));
}

var passport = require('passport');
var auth = require('./lib/auth');
var LocalStrategy = require('passport-local').Strategy;
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// passport init
app.use(session({
    secret:'thisisaverysecretphraseshhhh',
}));
app.use(require('connect-flash')());
app.use(passport.initialize());
app.use(passport.session());

passport.use('local', new LocalStrategy({usernameField: 'email'},auth.authenticate));
passport.serializeUser(auth.serializeUser);
passport.deserializeUser(auth.deserializeUser);

// set all routes for non-auth
app.use('/login', require('./routes/login'));
app.use('/register', require('./routes/register'));
app.use('/logout', require('./routes/logout'));
app.use('/', routes);
app.use('/api', require('./routes/api'));
app.use('/feedback', require('./routes/feedback'));

//require everything except /login to have auth
app.use(function(req,res,next){
    if(req.isAuthenticated()){
        res.locals.userid = req.user;
        next();
    } else {
        res.redirect('/login');
    }
});

// set all routes for auth
app.use('/talks', require('./routes/talks'));
app.use('/conferences', require('./routes/conferences'));
app.use('/profile', require('./routes/profile'));
app.use('/org', require('./routes/org'));
app.use('/dashboard', require('./routes/dashboard'));

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
