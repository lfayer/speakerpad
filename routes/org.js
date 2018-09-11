var express = require('express');
var router = express.Router();
var Org = app_require('lib/org.js');

router.get('/',  function(req, res, next) {
        res.send("here");
});

router.get('/:orgid/submissions',  function(req, res, next) {
   Org.getMemberSubmissions(req.params.orgid, function(err, submissions) {
        res.render('org/submissions', { title: 'Member submissions', errors: req.flash('error'), submissions:submissions });
    });
});

router.get('/:orgid/conferences',  function(req, res, next) {
   Org.getConferences(req.params.orgid, req.user, function(err, conferences) {
        res.render('org/conferences', { title: 'Relevant conferences', header: 'Relevant conferences', errors: req.flash('error'), conferences:conferences });
    });
});

/* DASHBOARD and APIs */
router.get('/:orgid/dashboard',  function(req, res, next) {
    res.render('org/dashboard', { title: 'Organization Dashboard', errors: req.flash('error'), orgid: req.params.orgid });
});

router.get('/:orgid/dashboard/latest-accepted',  function(req, res, next) {
   if (!req.user) {  res.redirect('/login'); }
   Org.getLatestAccepted(req.params.orgid, req.user, function(err, talks) {
        if (err) {
             res.send(err);
        } else {
           res.send(talks);
        }
    });
});

router.get('/:orgid/dashboard/upcoming-cfps',  function(req, res, next) {
   if (!req.user) {  res.redirect('/login'); }
   Org.getUpcomingCFPs(req.params.orgid, req.user, function(err, conferences) {
        if (err) {
             res.send(err);
        } else {
           res.send(conferences);
        }
    });
});

/* /DASHBOARD */

router.post('/add', function(req, res){
    if (!req.user) {  res.redirect('/login'); }
    var org = new Org(req.body);
    org.created_by = req.user;
    org.save(function(err) {
        if (err) {
            res.redirect('/profile');
            //TODO: fix redirect with error
            //res.render('profile', {
            //    title: 'User Profile',
            //    errors: [err]
            //});
        } else {
            res.redirect('/profile');
        }
    });
});

module.exports = router;
