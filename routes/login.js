var express = require('express');
var router = express.Router();
var auth = app_require('lib/auth.js');

var passport = require('passport');

router.get('/', auth.loggedIn, function(request, response, next) {
   response.render('login', { title: 'Login', errors: request.flash('error') });
});

router.post('/',
   passport.authenticate('local', {
       failureRedirect: '/login',
       successRedirect: '/',
       failureFlash: 'Failed to login'
   }), function(request, response, next) {
       next(request, response);
   });

module.exports = router;
