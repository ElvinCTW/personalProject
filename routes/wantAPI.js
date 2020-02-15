const express = require('express');
const router = express.Router();
const wantDAO = require('../dao/wantDAO');
const matchDAO = require('../dao/matchDAO');
const msgDAO = require('../dao/msgDAO');
const itemDAO = require('../dao/item');

router.post('/new', async (req, res, next) => {
  // 確認對方是否曾經想要你的物品
  // let matched = false;
  // let matchedArr =[];
  // let doubleMatchCount = 0;
  // let tripleCounter = 0;
  req.body.required_item = parseInt(req.body.required_item);
  // console.log(req.body.want_items_Arr);
  // console.log(req.body.want_items_Arr.split(','));
  const _2n3MatchResultObj = await wantDAO.get({
    wantArr: req.body.want_items_Arr.split(','),
    item_id: req.body.required_item,
  })
  // doubleMatchCount = checkMatchResultArr.length
  // 如果對方曾經有想要的，配對成功，等等要 alert 配對成功訊息
  // console.log('before checkMatchResultArr.length, wantAPI');
  // console.log(checkMatchResultArr.length);
  // if (checkMatchResultArr.length !== 0) {
  //   console.log('match true');
  //   matched = true;
  //   checkMatchResultArr.forEach((matchedWantRow)=>{
  //     matchedArr.push(parseInt(matchedWantRow.required_item_id));
  //   })

  // await wantDAO.update({
  //   matchedArr: matchedArr,
  //   item_id: req.body.required_item,
  // }).catch((err)=>{
  //   console.log(err.sqlMessage);
  //   console.log(err.sql);
  //   return;
  // });
  // } else {
  // 如果對方沒有想要的，進入三方配對
  // 取得 middle item wish list (end_items)
  // let middleItemWishListArr = await wantDAO.get({
  //   item_id: req.body.required_item,
  // })
  // if (middleItemWishListArr.length > 0) {
  // required_owner 有想要的東西
  // let _3rdQueryEndItemsIDArray = [];
  // middleItemWishListArr.forEach((want)=>{
  //   let item_id = parseInt(want.required_item_id);
  //   _3rdQueryEndItemsIDArray.push(item_id)
  // })
  // // 取得 end_items 的 wishLists 中有沒有 start_items 的結果
  // let matchedWantBetweenEndAndStart = await wantDAO.get({
  //   wantArr: req.body.want_items_Arr.split(','),
  //   endItemsArr: _3rdQueryEndItemsIDArray,
  // });
  // if (matchedWantBetweenEndAndStart.length > 0) {
  //   // 如果 triple change matched, 加入 matched table
  //   tripleCounter = matchedWantBetweenEndAndStart.length;
  //   console.log(req.body);
  //   console.log(req.body.required_item_owner);
  //   console.log(req.body.required_item);
  //   await matchDAO.insert({
  //     middle_owner: req.body.required_item_owner,
  //     middle_item_id : req.body.required_item,
  //     bridgeWantArr: matchedWantBetweenEndAndStart,
  //   }).catch((err)=>{
  //     console.log(err)
  //     return;
  //   })
  // } 
  // } 
  // }
  // Call wantDAO.insert
  const newWantInsertResult = await wantDAO.insert({
    wantArr: req.body.want_items_Arr.split(','),
    // want_owner: req.body.want_items_owner,
    required_item_id: req.body.required_item,
    // required_owner: req.body.required_item_owner,
    // matchedArr: matchedArr,
  })
  // Send back success or fail msg
  if (newWantInsertResult.errorMsg) {
    res.status(500).send(newWantInsertResult.errorMsg)
  } else {
    res.send({
      msg: ` Match Result: \n Insert ${newWantInsertResult.affectedRows} trade requrst, \n Find ${_2n3MatchResultObj.doubleMatchResultArr.length} double matches, \n Find ${_2n3MatchResultObj.tripleMatchResultArr.length} triple matches.`
    })
    // if (matched) {
    //   // alert user
    //   res.status(200).send({
    //     msg: `Congratulation, ${checkMatchResultArr.length} items have been added to match result page`,
    //   })
    // } else if (tripleCounter > 0) {
    //   // alert user for triple match
    //   res.status(200).send({
    //     msg: `Congratulation, a triple trade is made. ${tripleCounter} ways to change for this item are added to match result page`,
    //   })
    // } else {
    //   // if not match, only return success insertion msg
    //   res.status(200).send({
    //     msg: newWantInsertResult.msg,
    //   });
    // }
  }
});

router.post('/checked', async (req, res, next) => {
  console.log('req.body');
  console.log(req.body);
  /**
 * 檢查是否有成功的 confirmed 配對，若有查到則進行以下動作
 * 1.confirmed match 物品下架
 * 2.新增交換紀錄 ( in matched table)**
 * 3.對影響用戶進行通知 (只對 required_item_id = 下架產品 && check = confirmed 的用戶通知)**
 * 4.為成交用戶建立討論頁面 **
 */
  // 更新 want table check，並檢查有無 confirmed match，回傳需下架名單
  let checkConfirmedMatchResult = await wantDAO.update(req.body);
  if (checkConfirmedMatchResult.msg) {
    // 若有配對成功，繼續後續動作 id_Arr = [user, user_want, (3)]
    let id_Arr = [parseInt(req.body.want_item_id), parseInt(req.body.required_item_id)];
    if (checkConfirmedMatchResult.msg === 'tripleConfirmedMatch') {
      // 已按照時間排列，會選擇最先提出 want 的配對
      id_Arr.push(checkConfirmedMatchResult.itemC_idArr[0])
    }
    console.log('id_Arr');
    console.log(id_Arr);
    // 1.新增交換紀錄，並取得交易紀錄 ID (之後建立配對成功者聊天訊息和查詢配對紀錄用)**
    let insertMatchId = await matchDAO.insert({ id_Arr: id_Arr });
    // 2.物品下架
    let updateAvailabilitiesCount = await itemDAO.update({
      id_Arr: id_Arr,
      insertMatchId: insertMatchId,
    })
    if (updateAvailabilitiesCount !== id_Arr.length) {
      console.log('updateAvailabilitiesCount is not identical with id_Arr.length, updateAvailabilitiesCount is :');
      console.log(updateAvailabilitiesCount);
    }
    // 3.取得製作通知訊息的資訊 (被通知物品id、被通知人暱稱、下架物品id、下架物品 title)
    let notificationResult = await wantDAO.get({ id_Arr: id_Arr })
    // 3.1 過濾通知名單，製作 msg 內容
    // 取得通知配對成功名單 && 配對取消名單
    // let tempArr = notificationResult.filter(result => id_Arr.indexOf(result.notificated_item_id) === -1)

    // let cancelNotificationArr = [];
    // let matchedNotificationArr = [];
     let insertMsgQueryDataArr = [];
    notificationResult.forEach(notification=>{
      if (id_Arr.indexOf(notification.notificated_item_id) === -1) {
        insertMsgQueryDataArr.push([`哭哭！您以 ${notification.notificated_item_title} 對 ${notification.gone_item_title} 的交換請求，因該物品下架已被取消><`, 'system', notification.notificated_user, notification.gone_item_id, null, Date.now().toString()])
      } else {
        insertMsgQueryDataArr.push([`恭喜！您以 ${notification.notificated_item_title} 對 ${notification.gone_item_title} 的交換請求已成立～交換編號為${insertMatchId}，現在就打開交換溝通頁和對方討論交換細節吧！`, 'system', notification.notificated_user, notification.gone_item_id, insertMatchId, Date.now().toString()])
      }
    })
    // console.log('cancelNotificationArr');
    // console.log(cancelNotificationArr);
    // console.log('matchedNotificationArr')
    // console.log(matchedNotificationArr)
    console.log('insertMsgQueryDataArr')
    console.log(insertMsgQueryDataArr)
    // let insertMsgQueryDataArr = [];
    // cancelNotificationArr.forEach(notification => {
    //   insertMsgQueryDataArr.push([`您對 ${notification.gone_item_title} 的交換請求，因該物品下架已被取消`, 'system', notification.notificated_user, notification.gone_item_id, Date.now().toString()])
    // })
    // console.log('insertMsgQueryDataArr')
    // console.log(insertMsgQueryDataArr)
    // 3.2 將 msg 插入 message table 
    let insertedRowsCount = 0;
    if (insertMsgQueryDataArr.length > 0) {
      insertedRowsCount = await msgDAO.insert({
        insertMsgQueryDataArr: insertMsgQueryDataArr,
        action: 'insertItemGoneMsgToUser',
      })
    }
    if (insertedRowsCount !== insertMsgQueryDataArr.length) {
      console.log('something wrong when inserting gone msg in msgDAO');
      console.log('insertedRowsCount')
      console.log(insertedRowsCount)
      // console.log('matchedNotificationArr.length+cancelNotificationArr.length')
      // console.log(matchedNotificationArr.length+cancelNotificationArr.length)
      console.log('insertMsgQueryDataArr.length')
      console.log(insertMsgQueryDataArr.length)
    }
    console.log('finish notification of gone-item');
    // 4.建立用戶溝通頁面
    res.send({
      msg: '配對成功！商品已自動為您下架，請至配對頁查詢配對結果',
    })
  } else {
    res.send({
      msg: '目前尚未配對成功，請靜候通知，謝謝',
    })
  }

})

// get item matches result
router.get('/matches/:type', async (req, res, next) => {
  const checkMatchResultArr = await wantDAO.get({
    item_id: req.query.id,
    // item_type: req.params.type,
    user_nickname: req.query.nickname,
  })
  // // input: want_item_id
  // // to do: call wantDAO.get(want_item_id)
  // let matchesRequiredItemsDataArr = await wantDAO.get({
  //   item_id: parseInt(req.query.want_item_id),
  // })
  // // output: Items (which user gets) data of matches or errorMsg
  // if (matchesRequiredItemsDataArr.errorMsg) {
  //   res.status(500).send(matchesRequiredItemsDataArr.errorMsg)
  // } else {
  //   res.status(200).send(matchesRequiredItemsDataArr)
  // }
  let resArr = [];
  checkMatchResultArr.doubleMatchResultArr.forEach(element => {
    resArr.push(element)
  });
  checkMatchResultArr.tripleMatchResultArr.forEach(element => {
    resArr.push(element)
  })
  // console.log(resArr);
  res.send(resArr)
})

module.exports = router;
