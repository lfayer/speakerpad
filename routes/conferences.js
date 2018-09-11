var express = require('express');
var router = express.Router();
var Conference = app_require('lib/conference.js');

router.get('/',  function(req, res, next) {
   Conference.getConferencesForUser(req.user, function(err, conferences) {
        res.render('conferences', { title: 'Conferences', header: 'Conferences', errors: req.flash('error'), conferences:conferences });
    });
});

router.get('/add',  function(req, res, next) {
   res.render('conferences/modify', { title: 'Add Conference', user: req.user, conf: null, errors: req.flash('error') });
});

router.post('/add', function(req, res){
    req.body.userid = req.user;
    var conf = new Conference(req.body);
    conf.added_by = req.user;
    conf.save( function(err) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.redirect('/conferences/modify/'+conf.conferenceid);
        }
    });
});

router.get('/modify/:conferenceid',  function(req, res, next) {
    Conference.get(req.params.conferenceid, function(err, conference) {
        if (err) {
            res.redirect('/conferences');
        } else {
            res.render('conferences/modify', {
                title: 'Edit a conference',
                errors: req.flash('error'),
                conf:conference 
            });
        }
    });
});

router.post('/modify/:conferenceid', function(req, res){
    req.body.conferenceid = req.params.conferenceid;
    req.body.userid = req.user;
    var conference = new Conference(req.body);
    conference.save( function(err) {
        if (err) {
            console.log(err);
            res.render('conferences/modify/'+conf.conferenceid, { title: conf.conferenceid ? 'Modify':'Add' + ' a conference', conf: conference, errors: [err] });
        } else {
            res.redirect('/conferences');
        }
    });
});

router.post('/submit/talk', function(req, res){
    if (!req.user) {  res.redirect('/login'); }
    req.body.added_by = req.user;
    Conference.getByName(req.body.conference_name, function(err, conf) {
        if (conf.conferenceid) {
            conf.submitTalk(req.body.talkid, function(err) {
                    res.send("saved");
            });
        } else {
            var conference = new Conference(req.body);
            conference.save( function(err) {
                if (err) {

                } else {
                    conference.submitTalk(req.body.talkid, function(err) {
                    res.send("saved");
                });
                }
            });
        }
    });

});

router.get('/data/list/:searchstr', function(req, res, next) {
    Conference.getListByPartial(req.params.searchstr, function(err, conf_list ) {
        if (err) {
            res.send("{}");
        } else {
            res.send(JSON.stringify(conf_list));
        }
    });
});

router.post('/accept/talk', function(req, res){
    if (!req.user) {  res.redirect('/login'); }
    Conference.acceptTalk(req.body.conferenceid, req.body.talkid, req.body.accepted, function(err, conf_list ) {
        if (err) {
            res.send(err);
        } else {
            res.send('ok');
        }
    });
});



module.exports = router;
