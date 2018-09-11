var express = require('express');
var router = express.Router();
var Conference = app_require('lib/conference.js');
var Talk = app_require('lib/talk.js');

router.get('/upcoming-cfps',  function(req, res, next) {
    Conference.getUpcomingCFPs(function(err, conferences) {
        if (err) {
             res.send(err);
        } else {
           res.send(conferences);
        }
    });
});
router.get('/upcoming-talks',  function(req, res, next) {
    if (!req.user) {  res.status(403).send('Denied'); }
    Talk.getUpcomingTalks(req.user, function(err, talks) {
        if (err) {
            console.log(err);
             res.send(err);
        } else {
           res.send(talks);
        }
    });
});

module.exports = router;
