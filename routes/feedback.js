var express = require('express');
var Talk = app_require('lib/talk.js');
var router = express.Router();

router.get('/', function(req, res, next) {
     res.render('feedback', {title: "Thank you for your feedback", obj:null, errors: [err] });
});

router.get('/:conference_slug/:talk_slug', function(req, res, next) {
   Talk.getBySlugs(req.params.conference_slug, req.params.talk_slug, function(err, obj) {
        if (err) {
            console.log(err);
        } else {
            res.render('feedback', {title: "Feedback for "+obj.title+" at "+obj.conference_name, obj:obj, errors: [err] });
        }
    }); 
});

router.post('/:conference_slug/:talk_slug', function(req, res){
    req.body.ip = req.headers['x-forwarded-for'];
    Talk.saveFeedback(req.body, function(err) {
        if (err) {
            console.log(err);
        } 
         res.render('feedback', {title: "Thank you for your feedback", obj:null, errors: [err] });
    });
});

module.exports = router;
