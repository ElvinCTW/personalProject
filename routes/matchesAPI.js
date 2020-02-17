const express = require('express');
const router = express.Router();
const matchDAO = require('../dao/matchDAO')
const itemDAO = require('../dao/item')
const msgDAO = require('../dao/msgDAO')
// const wantDAO = require('../dao/wantDAO')

router.get('/item/:type', async (req, res, next) => {
  console.log(checkMatchResultArr);
  res.send(checkMatchResultArr)
})

router.get('/confirmed', async (req, res, next) => {
  //取得 matched table 的資料 及對應 matched_id 的 msg table 資料
  // content, sender, time
  let msgArr = await msgDAO.get({
    action: 'getConfirmedMatchMsg',
    matched_id: parseInt(req.query.matched_id),
  })
  // 取得 matched_items_id
  let matchedItemsIdObj = await matchDAO.get({
    action: 'getConfirmedMatchItemsId',
    matched_id: parseInt(req.query.matched_id),
  }).catch((err) => { console.log(err) });
  // 整理取得 item Data
  console.log('matchedItemsIdObj')
  console.log(matchedItemsIdObj)
  // let idArr = Object.values(matchedItemsIdObj).filter(id=> typeof id === 'number')
  let idArr = Object.values(matchedItemsIdObj)
  let itemDataArr = await itemDAO.get({
    action: 'getConfirmedMatchItemsData',
    idArr: idArr,
  });
  res.send({
    msgArr: msgArr,
    itemDataArr: itemDataArr,
  })
  // idArr.forEach()
})

router.post('/status', async (req, res, next) => {
  let checkAllConfirmResultArr = await matchDAO.update(req.body)
  console.log(checkAllConfirmResultArr);
  console.log('checkAllConfirmResultArr.length is ' + checkAllConfirmResultArr.length);
  if (checkAllConfirmResultArr.length > 0) {
    // 假如 all users confirmed, update item availability to false
    let updateAvailabilityresult
    if (req.body.want_item_id && req.body.required_item_id) {
      updateAvailabilityresult = await itemDAO.update({
        want_item_id: req.body.want_item_id,
        required_item_id: req.body.required_item_id,
      }).catch((err) => {
        console.log(err);
      })
    } else {
      updateAvailabilityresult = await itemDAO.update({
        start_item_id: checkAllConfirmResultArr[0].start_item_id,
        middle_item_id: checkAllConfirmResultArr[0].middle_item_id,
        end_item_id: checkAllConfirmResultArr[0].end_item_id,
      }).catch((err) => {
        console.log(err);
      })
    }
    res.send(updateAvailabilityresult);
    // notificate users 
  } else {
    res.send(checkAllConfirmResultArr);
  }
})
module.exports = router;