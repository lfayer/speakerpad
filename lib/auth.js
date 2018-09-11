var passport = require('passport');
var User = app_require('lib/user.js');

function serializeUser(user, done) {
    done(null, user.userid);
}

function deserializeUser(userid, done) {
   done(null, userid);
}

function authenticate(email,password,done) {
    User.getByEmailPassword(email,password,function(err,user){
        if(err){
            return done(err);
        } else {
            console.log(user);
            if(user && user.userid){
                return done(null,user);
            } else {
                return done(null, false, {message: 'Incorrect username or password'});
            }
        }
    });
}

function loggedOut(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

function loggedIn(req, res, next) {
    if (req.user) {
        res.redirect('/');
    } else {
        next();
    }
}

module.exports = {
    serializeUser: serializeUser,
    deserializeUser: deserializeUser,
    authenticate: authenticate,
    loggedIn: loggedIn
};
