const express = require('express');
const router = express.Router();
const wantDAO = require('../dao/wantDAO');

router.post('/new', async (req, res, next) => {
  // 確認對方是否曾經想要你的物品
  let matched = false;
  const matchedArr =[];
  req.body.required_item = parseInt(req.body.required_item);
  const checkMatchResultArr = await wantDAO.get({
    wantArr: req.body.want_items_Arr.split(','),
    item_id: req.body.required_item,
  })
  // 如果對方曾經有想要的，配對成功，等等要 alert 配對成功訊息
  if (checkMatchResultArr.length !== 0) {
    console.log('match true');
    matched = true;
    checkMatchResultArr.forEach((matchedWantRow)=>{
      matchedArr.push(parseInt(matchedWantRow.required_item_id));
    })
    const updateMatchResult = wantDAO.update({
      matchedArr: matchedArr,
      item_id: req.body.required_item,
    }).catch((err)=>{
      console.log('error in checkPreviousWantPromise');
      console.log(err.sqlMessage);
      console.log(err.sql);
      return;
    });
  }
  // Call wantDAO.insert
  const newWantInsertResult = await wantDAO.insert({
    wantArr: req.body.want_items_Arr,
    want_owner: req.body.want_items_owner,
    required: req.body.required_item,
    required_owner: req.body.required_item_owner,
    matchedArr: matchedArr,
  })
  // Send back success or fail msg
  if (newWantInsertResult.errorMsg) {
    res.status(500).send(newWantInsertResult.errorMsg)
  } else {
    if (matched) {
      // alert user
      res.status(200).send({
        msg: `Congratulation, ${checkMatchResultArr.length} items have been added to match result page`,
      })
    } else {
      // if not match, only return success insertion msg
      res.status(200).send({
        msg: newWantInsertResult.msg,
      });
    }
  }
});

module.exports = router;
