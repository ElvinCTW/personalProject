const express = require('express');
const router = express.Router();
const wantDAO = require('../dao/wantDAO');

router.post('/new', async (req, res, next) => {
  // Call wantDAO
  // console.log(req.body);
  const newWantInsertResult = await wantDAO.insert({
    wantArr: req.body.wantArr,
    want_owner: req.body.want_owner,
    required: req.body.required,
    required_owner: req.body.required_owner,
  })
  // Send back success or fail msg
  if (newWantInsertResult.errorMsg) {
    res.status(500).send(newWantInsertResult.errorMsg)
  } else {
    res.status(200).send(newWantInsertResult.msg);
  }
});

module.exports = router;
