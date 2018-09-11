var express = require('express');
var router = express.Router();
var Talk = app_require('lib/talk.js');

router.get('/',  function(req, res, next) {
    Talk.getAllbyUserWithStats(req.user, function(err, talks) {
        res.render('talks', { title: 'Talks', talks: talks, errors: req.flash('error') });
    });
});

router.get('/add',  function(req, res, next) {
   res.render('talks/modify', { title: 'Add a talk', errors: req.flash('error'), talk:'' });
});

router.get('/modify/:talkid',  function(req, res, next) {
    Talk.get(req.params.talkid, function(err, talk) {
        if (err) {
            res.render('talks/talks', { 
                title: 'Talks', 
                errors: [err]
                 });
        } else {
            res.render('talks/modify', { 
                title: 'Edit a talk',
                errors: req.flash('error'),
                talk: talk
            });
        }
    });
});

router.post('/add', function(req, res){
    req.body.userid = req.user;
    var talk = new Talk(req.body);
    talk.save( function(err) {
        if (err) {
            res.render('talks/modify', { title: talk.talkid ? 'Modify':'Add' + ' a talk', talk: talk, errors: [err] });
        } else {
            res.redirect('/talks');
        }
    });
});

router.post('/modify/:talkid', function(req, res){
    req.body.talkid = req.params.talkid;
    req.body.userid = req.user;
    var talk = new Talk(req.body);
    talk.save( function(err) {
        if (err) {
            res.render('talks/modify/'+talk.talkid, { title: talk.talkid ? 'Modify':'Add' + ' a talk', talk: talk, errors: [err] });
        } else {
            res.redirect('/talks');
        }
    });
});

router.get('/delete/:talkid', function(req, res){
    req.body.talkid = req.params.talkid;
    req.body.userid = req.user;
    var talk = new Talk(req.body);
    talk.delete( function(err) {
        if (err) {
            res.render('talks', { title: 'Talks', talk: talk, errors: [err] });
        } else {
            res.redirect('/talks');
        }
    });
});

router.get('/submissions',  function(req, res, next) {
   Talk.getSubmittedByUser(req.user, function(err, submissions) {
        res.render('talks/submissions', { title: 'Review submitted talks', errors: req.flash('error'), submissions:submissions, req:req });
    });
});



module.exports = router;
