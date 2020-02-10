const express = require('express');
const router = express.Router();
const matchDAO = require('../dao/matchDAO')

router.get('/item/:type', async (req, res, next) => {
  // input : item_id, item_type
  console.log('start matchDAO');
  const checkMatchResultArr = await matchDAO.get({
    item_id: req.query.id,
    item_type:req.params.type,
  })
  console.log('end matchDAO');
  res.send(checkMatchResultArr)
  // to do : call matchADO.get() w/ item_id and item_type
  // output : match data of item
})
module.exports = router;