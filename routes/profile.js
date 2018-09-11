var express = require('express');
var router = express.Router();
var User = app_require('lib/user.js');
var Bio = app_require('lib/bio.js');
var Org = app_require('lib/org.js');


router.get('/',  function(req, res, next) {
    User.get(req.user, function(err, user) {
        Bio.getAllbyUser(req.user, function(err, bios) {
            Org.getOrgsByUser(req.user, function(err, orgs) {
                res.render('profile', { title: 'User profile', user: user, bios: bios, orgs: orgs, errors: req.flash('error') });
            });
        });
    });
});

router.post('/', function(req, res){
    req.body.userid = req.user;
    var user = new User(req.body);
    user.save( function(err) {
        if (err) {
            console.log(err);
            res.render('profile', { title: 'User profile', errors: [err] });
        } else {
            res.redirect('/profile');
        }
    });
});

router.post('/bio/add', function(req, res){
    req.body.userid = req.user;
    var bio = new Bio(req.body);
    bio.save( function(err) {
        res.redirect('/profile');
    });
});

router.get('/bio/delete/:bioid', function(req, res){
    req.body.bioid = req.params.bioid;
    req.body.userid = req.user;
    var bio = new Bio(req.body);
    bio.delete( function(err) {
       res.redirect('/profile');
    });
});

module.exports = router;
