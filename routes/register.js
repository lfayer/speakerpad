var express = require('express');
var router = express.Router();
var User = app_require('lib/user.js');
var auth = app_require('lib/auth.js');

router.get('/', auth.loggedIn, function(req, res, next) {
   res.render('register', { title: 'Register', user: null, errors: req.flash('error') });
});

router.post('/', function(req, res){
    var user = new User(req.body);
    user.save( function(err) {
        if (err) {
            res.render('register', { title: 'Register', errors: [err] });
        } else {
            res.redirect('/talks');
        }
    });
});

module.exports = router;

