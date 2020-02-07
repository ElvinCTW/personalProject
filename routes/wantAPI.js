const express = require('express');
const router = express.Router();
const wantDAO = require('../dao/wantDAO');

router.post('/new', async (req, res, next) => {
  // 確認對方是否曾經想要你的物品
  let matched = false;
  let tripleMatched = false;
  let matchedArr =[];
  let tripleMatchedArr =[];
  let tripleCounter = 0;
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
    await wantDAO.update({
      matchedArr: matchedArr,
      item_id: req.body.required_item,
    }).catch((err)=>{
      console.log('error in checkPreviousWantPromise');
      console.log(err.sqlMessage);
      console.log(err.sql);
      return;
    });
  } else {
    // 如果對方沒有想要的，進入三方配對
    // 取得 middle item wish list (end_items)
    let middleItemWishListArr = await wantDAO.get({
      item_id: req.body.required_item,
    })
    // foreach 比對 end_items 的個別 wish list 中有無 first_items 存在
    middleItemWishListArr.forEach((wantBetweenMiddleAndEnd)=>{
      const endMatchStartResultArr = wantDAO.get({
        wantArr: wantArr,
        want_item_id: wantBetweenMiddleAndEnd.required_item,
      })
      if (endMatchStartResultArr.length !== 0) {
        // this end_item match something of start_items
        console.log('triple match true');
        tripleMatched = true;
        endMatchStartResultArr.forEach((wantBetweenEndAndStart)=>{
          // insert data into 
          tripleMatchedArr.push({
            start_item_id: wantBetweenEndAndStart.required_item_id,
            start_owner: wantBetweenEndAndStart.required_owner,
            middle_item_id: req.body.required_item,
            middle_owner: req.body.want_items_owner,
            end_item_id: wantBetweenEndAndStart.want_item_id,
            end_owner: wantBetweenEndAndStart.want_owner,
          });
          tripleCounter += 1;
        })
      } 
    })
    // 有 === 三方配對成功，alert訊息並存入 matched table
    // 無 === 三方配對也失敗， alert 新增訊息
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
    } else if (tripleMatched) {
      // alert user for triple match
    } else {
      // if not match, only return success insertion msg
      res.status(200).send({
        msg: newWantInsertResult.msg,
      });
    }
  }
});

module.exports = router;
