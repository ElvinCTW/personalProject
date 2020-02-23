const express = require('express');
const router = express.Router();
const wantDAO = require('../dao/wantDAO');
const matchDAO = require('../dao/matchDAO');
const msgDAO = require('../dao/msgDAO');
const itemDAO = require('../dao/item');

router.post('/new', async (req, res, next) => {
  // 確認使用者為本人
  let checkUserResult = await userDAO.get({
    action: 'getUserDataByToken',
    token: req.body.token,
  }).catch(err=>{res.status(500).send('資料庫錯誤');})
  if (checkUserResult.length === 1) {
    // 確認對方是否曾經想要你的物品
    // let curUserId = checkUserResult[0].id
    req.body.required_item = parseInt(req.body.required_item);
    const _2n3MatchResultObj = await wantDAO.get({
      wantArr: req.body.want_items_Arr.split(','),
      item_id: req.body.required_item,
    })
    // Call wantDAO.insert
    const newWantInsertResult = await wantDAO.insert({
      wantArr: req.body.want_items_Arr.split(','),
      required_item_id: req.body.required_item,
    })
    // 建立通知被配對者的訊息
    let msgArr = [];
    if (newWantInsertResult.errorMsg) {
      res.status(500).send(newWantInsertResult.errorMsg)
    } else {
      // 建立 msg 通知交易者
      if (_2n3MatchResultObj.doubleMatchResultArr.length > 0) {
        // double match msg
        // content, sender, receiver, time, mentioned_item_id
        _2n3MatchResultObj.doubleMatchResultArr.forEach(doubleMatch => {
          // 通知 B_nickname A_title
          msgArr.push([`您對"${doubleMatch.A_title}"的兩人配對已成立，快到配對確認頁面查看吧！`, 'system', doubleMatch.B_nickname, Date.now().toString(), doubleMatch.required_item_id])
        })
      }
      if (_2n3MatchResultObj.tripleMatchResultArr.length > 0) {
        // 取得 B_nickname
        let getBItemDetailResult = await itemDAO.get({
          type: 'detail',
          item_id: req.body.required_item,
        })
        // triple match msg
        // content, sender, receiver, time, mentioned_item_id
        _2n3MatchResultObj.tripleMatchResultArr.forEach(tripleMatch => {
          // 先做通知 B + C title 再做 C + A_title
          msgArr.push(
            [`您對"${tripleMatch.C_title}"的三人配對已成立，快到配對確認頁面查看吧！`, 'system', getBItemDetailResult[0].user_nickname, Date.now().toString(), tripleMatch.want_item_id],
            [`您對"${tripleMatch.A_title}"的三人配對已成立，快到配對確認頁面查看吧！`, 'system', tripleMatch.C_nickname, Date.now().toString(), req.body.required_item]
          )
        })
      }
      if (msgArr.length > 0) {
        const newMatchMsgInsertionCounts = await msgDAO.insert({
          action: 'insertNewMatchMsg',
          msgArr: msgArr,
        })
        if (newMatchMsgInsertionCounts !== (_2n3MatchResultObj.tripleMatchResultArr.length * 2 + _2n3MatchResultObj.doubleMatchResultArr.length)) {
          console.log(`insertion msg counts is not normal, insetion counts is ${newMatchMsgInsertionCounts}, tripleMatchMsgCount is ${_2n3MatchResultObj.tripleMatchResultArr.length * 2} and doubleMatchMsgCount is ${_2n3MatchResultObj.doubleMatchResultArr.length}`);
        }
      }
      // Send back success or fail msg
      res.send({
        msg: ` 配對結果: \n 已新增 ${newWantInsertResult.affectedRows} 個交換請求, \n 為您找到 ${_2n3MatchResultObj.doubleMatchResultArr.length} 個雙人交換, \n 找到 ${_2n3MatchResultObj.tripleMatchResultArr.length} 三人交換`
      })
    }
  } else {
    res.status(500).send('此token查無用戶');
  }
});

router.post('/checked', async (req, res, next) => {
  // console.log('req.body');
  // console.log(req.body);
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
    // console.log('id_Arr');
    // console.log(id_Arr);
    // 1.新增交換紀錄，並取得交易紀錄 ID (之後建立配對成功者聊天訊息和查詢配對紀錄用)**
    let insertMatchId = await matchDAO.insert({ id_Arr: id_Arr });
    // 2.物品下架
    let updateAvailabilitiesCount = await itemDAO.update({
      id_Arr: id_Arr, // [user, user_want, (3)]
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
    notificationResult.forEach(notification => {
      if (id_Arr.indexOf(notification.notificated_item_id) === -1) {
        insertMsgQueryDataArr.push([`哭哭！您以"${notification.notificated_item_title}"對"${notification.gone_item_title}" 的交換請求，因該物品下架已被取消><`, 'system', notification.notificated_user, notification.gone_item_id, null, Date.now().toString()])
      } else {
        insertMsgQueryDataArr.push([`恭喜！您以"${notification.notificated_item_title}"對"${notification.gone_item_title}"的交換請求已成立～交換編號為${insertMatchId}，現在就打開交換溝通頁和對方討論交換細節吧！`, 'system', notification.notificated_user, notification.gone_item_id, insertMatchId, Date.now().toString()])
      }
    })
    // console.log('cancelNotificationArr');
    // console.log(cancelNotificationArr);
    // console.log('matchedNotificationArr')
    // console.log(matchedNotificationArr)
    // console.log('insertMsgQueryDataArr')
    // console.log(insertMsgQueryDataArr)
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
    // console.log('finish notification of gone-item');
    // 4.建立用戶溝通頁面
    res.send({
      msg: '配對成功！商品已自動為您下架，請至配對頁查詢配對結果',
    })
  } else {
    res.send({
      msg: '目前尚未配對成功，請耐心等候～',
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

router.get('/last', async (req, res, next) => {
  let userSelectedItemIdArr = await wantDAO.get({
    action: 'getUserSelectedItemIdArr',
    item_id: req.query.required_item_id,
    user_nickname: req.query.user_nickname,
  })
  res.send(userSelectedItemIdArr);
})

module.exports = router;
