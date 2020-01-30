var express = require('express');
var router = express.Router();
var user = null;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Triange Trade', user: user});
});

module.exports = router;
