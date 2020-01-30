var express = require('express');
var router = express.Router();
var user = null;

/* GET home page. */
router.get('/add', function(req, res, next) {
  res.render('item_add', { title: 'Add item', user: user});
});

module.exports = router;