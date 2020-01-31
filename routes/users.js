var express = require('express');
var router = express.Router();

router.get('/signup', function(req, res, next) {
  res.render('signup');
});

router.get('/signin', function(req, res, next) {
  res.render('signin');
});

module.exports = router;
