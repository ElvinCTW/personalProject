const express = require('express');
const router = express.Router();
const matchDAO = require('../dao/matchDAO')
const itemDAO = require('../dao/item')
const msgDAO = require('../dao/msgDAO')
// const wantDAO = require('../dao/wantDAO')

router.get('/item/:type', async (req, res, next) => {
  // // input : item_id, item_type
  // console.log('start matchDAO');
  // const checkMatchResultArr = await wantDAO.get({
  //   item_id: req.query.id,
  //   item_type: req.params.type,
  // })
  // console.log('end matchDAO');
  // let resArr = [];
  // checkMatchResultArr.forEach(matchResult => {
  //   resArr.push({
  //     doubleMatchData: {
  //       matched: matchResult.matched,
  //       ownersArr: [matchResult.want_owner, matchResult.required_owner],
  //       owner_checkArr: [matchResult.want_owner_check, matchResult.required_owner_check],
  //     },
  //     tripleMatchData: {
  //       triple_id: matchResult.triple_id,
  //       ownersArr: [matchResult.start_owner, matchResult.middle_owner, matchResult.end_owner],
  //       owner_checkArr: [matchResult.start_owner_check, matchResult.middle_owner_check, matchResult.end_owner_check],
  //     },
  //     itemData: {
  //       id: matchResult.id,
  //       user_id: matchResult.user_id,
  //       main_category: matchResult.main_category,
  //       sub_category: matchResult.sub_category,
  //       tags: matchResult.tags,
  //       title: matchResult.title,
  //       status: matchResult.status,
  //       count: matchResult.count,
  //       introduction: matchResult.introduction,
  //       pictures: matchResult.pictures,
  //       time: matchResult.time,
  //       user_nickname: matchResult.user_nickname,
  //       availability: matchResult.availability,
  //     }
  //   })
  // })
  console.log(checkMatchResultArr);
  res.send(checkMatchResultArr)
  // to do : call matchADO.get() w/ item_id and item_type
  // output : match data of item
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
  }).catch((err)=>{console.log(err)});
  // 整理取得 item Data
  let itemDataArr = [];
  console.log('matchedItemsIdObj')
  console.log(matchedItemsIdObj)
  // let idArr = Object.values(matchedItemsIdObj).filter(id=> typeof id === 'number')
  let idArr = Object.values(matchedItemsIdObj)
  idArr.forEach( async (id)=> {
    let itemData = await itemDAO.get({
      action: 'getConfirmedMatchItemsData',
      item_id: id,
    });
    itemDataArr.push(itemData[0]);
    if (idArr.indexOf(id) === (idArr.length-1)) {
      res.send({
        msgArr:msgArr,
        itemDataArr:itemDataArr,
      })
    }
  });
  // idArr.forEach()
})

router.post('/status', async (req, res, next) => {
  let checkAllConfirmResultArr = await matchDAO.update(req.body)
  console.log(checkAllConfirmResultArr);
  console.log('checkAllConfirmResultArr.length is '+checkAllConfirmResultArr.length);
  if (checkAllConfirmResultArr.length > 0) {
    // 假如 all users confirmed, update item availability to false
    let updateAvailabilityresult
    if (req.body.want_item_id && req.body.required_item_id) {
      updateAvailabilityresult = await itemDAO.update({
        want_item_id: req.body.want_item_id,
        required_item_id: req.body.required_item_id,
      }).catch((err)=>{
        console.log(err);
      })
    } else {
      updateAvailabilityresult = await itemDAO.update({
        start_item_id: checkAllConfirmResultArr[0].start_item_id,
        middle_item_id: checkAllConfirmResultArr[0].middle_item_id,
        end_item_id: checkAllConfirmResultArr[0].end_item_id,
      }).catch((err)=>{
        console.log(err);
      })
    }
    res.send(updateAvailabilityresult);
    // notificate users 
    /**
     * 新增 msg model ?
     */
  } else {
    res.send(checkAllConfirmResultArr);
  }
})
module.exports = router;