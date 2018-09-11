var express = require('express');
var router = express.Router();

router.all('/', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
