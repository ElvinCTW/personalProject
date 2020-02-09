const express = require('express');
const router = express.Router();
const wantDAO = require('../dao/wantDAO');
const matchDAO = require('../dao/matchDAO');

router.post('/new', async (req, res, next) => {
  // 確認對方是否曾經想要你的物品
  let matched = false;
  let matchedArr =[];
  let tripleCounter = 0;
  req.body.required_item = parseInt(req.body.required_item);
  console.log(req.body.want_items_Arr);
  console.log(req.body.want_items_Arr.split(','));
  const checkMatchResultArr = await wantDAO.get({
    wantArr: req.body.want_items_Arr.split(','),
    item_id: req.body.required_item,
  })
  // 如果對方曾經有想要的，配對成功，等等要 alert 配對成功訊息
  console.log('before checkMatchResultArr.length, wantAPI');
  console.log(checkMatchResultArr.length);
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
    if (middleItemWishListArr.length > 0) {
      // required_owner 有想要的東西
      let _3rdQueryEndItemsIDArray = [];
      middleItemWishListArr.forEach((want)=>{
        let item_id = parseInt(want.required_item_id);
        _3rdQueryEndItemsIDArray.push(item_id)
      })
      // 取得 end_items 的 wishLists 中有沒有 start_items 的結果
      let matchedWantBetweenEndAndStart = await wantDAO.get({
        wantArr: req.body.want_items_Arr.split(','),
        endItemsArr: _3rdQueryEndItemsIDArray,
      });
      if (matchedWantBetweenEndAndStart.length > 0) {
        // 如果 triple change matched, 加入 matched table
        tripleCounter = matchedWantBetweenEndAndStart.length;
        console.log(req.body);
        console.log(req.body.required_item_owner);
        console.log(req.body.required_item);
        await matchDAO.insert({
          middle_owner: req.body.required_item_owner,
          middle_item_id : req.body.required_item,
          bridgeWantArr: matchedWantBetweenEndAndStart,
        }).catch((err)=>{
          console.log(err)
          return;
        })
      } 
    } 
  }
  // Call wantDAO.insert
  const newWantInsertResult = await wantDAO.insert({
    wantArr: req.body.want_items_Arr.split(','),
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
    } else if (tripleCounter > 0) {
      // alert user for triple match
      res.status(200).send({
        msg: `Congratulation, a triple trade is made. ${tripleCounter} ways to change for this item are added to match result page`,
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
