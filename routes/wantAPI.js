const express = require('express');
const router = express.Router();
const wantDAO = require('../dao/wantDAO');
const {getWantBetweenItemIds, getWantOfItemsByItemIds} = require('../dao/wantDAO');
const matchDAO = require('../dao/matchDAO');
const {getUserDataByToken} = require('../dao/user');
const msgDAO = require('../dao/msgDAO');
const {getItemDataByIdArr} = require('../dao/item');
const itemDAO = require('../dao/item');
const mysql = require('../util/mysql')

// item_detail page 建立 want 用
router.post('/new', async (req, res, next) => {
  // 用 token 辨識使用者
  const checkUserResult = await getUserDataByToken(req.body.token);
  if (checkUserResult.length === 1) {
    // 轉換資料為數字
    const secondItemId = parseInt(req.body.required_item);
    const intCurUserItemsIdArr = req.body.want_items_Arr.split(',').map(item_id => parseInt(item_id))
    // 取得邀請結果與第三人物品ID
    const { wantOfSecondUserToCurUserItems, wantOfThirdItemsToCurUserItems, thirdItemsIds }
      = await getInvitationMatchResult(secondItemId, intCurUserItemsIdArr)
    // 建立當前 user's want
    const newWantInsertResult = await wantDAO.insertNewWant(intCurUserItemsIdArr, secondItemId)
    if (newWantInsertResult.affectedRows < 1) {
      res.status(500).send(newWantInsertResult.errorMsg)
    } else {
      // 取得物品資料
      const itemsDataOfAllObj = await getRelatedItemsData(thirdItemsIds, intCurUserItemsIdArr, secondItemId)
      // 傳送通知訊息
      await sendMsgToMatchers(wantOfSecondUserToCurUserItems, wantOfThirdItemsToCurUserItems, itemsDataOfAllObj, secondItemId, checkUserResult)
      // Send back success or fail msg
      res.send({
        msg: ` 配對結果: \n 已新增 ${newWantInsertResult.affectedRows} 個交換請求, \n 為您找到 ${wantOfSecondUserToCurUserItems.length} 個雙人交換, \n 找到 ${wantOfThirdItemsToCurUserItems.length} 三人交換`
      })
    }
  } else {
    res.status(500).send('此token查無用戶');
  }
});

// want 配對頁面讀取未成立交換資料用
router.get('/check', async (req, res, next) => {
  let doubleMatchResultArr = [];
  let tripleMatchResultArr = [];
  const token = req.headers.authorization.split(' ')[1]
  const curUserWantArr = await getUserWantByToken(token);

  if (curUserWantArr.length === 0) {
    res.send({ doubleMatchResultArr, tripleMatchResultArr })
  } else {
    const secondItemWantArr = await getItemsWantByItemIds(curUserWantArr)
    if (secondItemWantArr.length === 0) {
      res.send({ doubleMatchResultArr, tripleMatchResultArr })
    } else {
      // 排除空查詢後處理資料
      doubleMatchResultArr = getDoubleMatchArr(curUserWantArr, secondItemWantArr)
      tripleMatchResultArr = await getTripleMatchArr(secondItemWantArr, curUserWantArr)
      const itemsDataArr = await getItemsData(doubleMatchResultArr, tripleMatchResultArr)
      res.send({ doubleMatchResultArr, tripleMatchResultArr, itemsDataArr })
    }
  }
})

// 配對頁面按下確認鍵時用
router.post('/checked', async (req, res, next) => {
  let { want_item_id, required_item_id } = req.body
  const token = req.headers.authorization.split(' ')[1];
  const item_id = parseInt(req.body.want_item_id);
  const userCheck = await getUserDataByToken(token, item_id)

  if (userCheck.length > 0) {
    let response = await wantConfirmTransaction(want_item_id, required_item_id)
      .catch(err => console.log(err))
    res.send(response)
  } else { res.status(400).send({ errorMsg: '身份驗證失敗' }) }
})

// want 確認頁取得資料用
router.get('/matches/:type', async (req, res, next) => {
  const checkMatchResultArr = await wantDAO.get({
    action: 'getMatchesByWantItem',
    item_id: req.query.id,
    // item_type: req.params.type,
    token: req.headers.authorization.split(' ')[1],
  })
  let allMatchesResultArr = [];
  checkMatchResultArr.doubleMatchResultArr.forEach(element => {
    allMatchesResultArr.push(element)
  });
  checkMatchResultArr.tripleMatchResultArr.forEach(element => {
    allMatchesResultArr.push(element)
  })
  // console.log(allMatchesResultArr);
  res.send(allMatchesResultArr)
})

// item_detail page 取得先前已選擇過的物品清單用
router.get('/last', async (req, res, next) => {
  let userSelectedItemIdArr = await wantDAO.get({
    action: 'getUserSelectedItemIdArr',
    item_id: req.query.required_item_id,
    user_nickname: req.query.user_nickname,
  })
  let lastSelectionArr = userSelectedItemIdArr.map(obj => obj.id)
  res.send(lastSelectionArr);
})


/**
 * functions
 */

async function getInvitationMatchResult(secondItemId, intCurUserItemsIdArr) {
  const wantOfSecondUserToCurUserItems = await getWantBetweenItemIds([secondItemId], intCurUserItemsIdArr)
  const wantOfsecondItemToThirdItems = await getWantOfItemsByItemIds(secondItemId)
  const thirdItemsIds = wantOfsecondItemToThirdItems.map(want => want.required_item_id);
  const wantOfThirdItemsToCurUserItems=thirdItemsIds.length>1?await getWantBetweenItemIds(thirdItemsIds, intCurUserItemsIdArr):[];
  return {
    wantOfSecondUserToCurUserItems,
    wantOfThirdItemsToCurUserItems,
    thirdItemsIds,
  }
}

function sendMsgToNoMatcher(itemsDataOfAllObj, secondItemId, checkUserResult) {
  return msgDAO.insert({
    action: 'insertMsgToOtherUserWhenNoMatch',
    msg: {
      content: `您的物品"${itemsDataOfAllObj[secondItemId].title}"收到了來自"${checkUserResult[0].nickname}"的新交換邀請，快到"邀請"頁面查看一下吧`,
      receiver: itemsDataOfAllObj[secondItemId].user_id,
      sender: 'system',
      time: Date.now().toString(),
      type: '/want/invitation'
    }
  })
}

async function getRelatedItemsData(thirdItemsIds, intCurUserItemsIdArr, secondItemId) {
  let itemsIdOfAll = thirdItemsIds.concat(intCurUserItemsIdArr)
  itemsIdOfAll.push(secondItemId)
  const itemsDataOfAll = await getItemDataByIdArr(itemsIdOfAll)
  const itemsDataOfAllObj = {};
  itemsDataOfAll.forEach(data => {
    itemsDataOfAllObj[data.id] = data;
  })
  return itemsDataOfAllObj;
}

async function sendMsgToMatchers(wantOfSecondUserToCurUserItems, wantOfThirdItemsToCurUserItems, itemsDataOfAllObj, secondItemId, checkUserResult) {
  let msgArr = [];
  if (wantOfSecondUserToCurUserItems.length === 0 &&
    wantOfThirdItemsToCurUserItems.length === 0) {
    const insertCount = await sendMsgToNoMatcher(itemsDataOfAllObj, secondItemId, checkUserResult)
    if (insertCount !== 1) {
      console.log('insertCount not equal to 1, it is ' + insertCount)
    }
  } else {
    if (wantOfSecondUserToCurUserItems.length > 0) {
      // double match msg
      // content, sender, receiver, time, mentioned_item_id
      wantOfSecondUserToCurUserItems.forEach(doubleMatch => {
        // 通知 B_nickname A_title
        msgArr.push([`已建立您對"${itemsDataOfAllObj[doubleMatch.required_item_id].title}"的一組新兩人配對，快到"配對"頁面確認吧！`, 'system', itemsDataOfAllObj[doubleMatch.want_item_id].user_id, Date.now().toString(), doubleMatch.required_item_id])
      })
    }
    if (wantOfThirdItemsToCurUserItems.length > 0) {
      // triple match msg
      // content, sender, receiver, time, mentioned_item_id
      wantOfThirdItemsToCurUserItems.forEach(tripleMatch => {
        // 先做通知 B + C title 再做 C + A_title
        msgArr.push(
          [`已建立您對"${itemsDataOfAllObj[tripleMatch.want_item_id].title}"的一組新三人配對，快到"配對"頁面確認吧！`, 'system', itemsDataOfAllObj[secondItemId].user_id, Date.now().toString(), tripleMatch.want_item_id],
          [`已建立您對"${itemsDataOfAllObj[tripleMatch.required_item_id].title}"的一組新三人配對，快到"配對"頁面確認吧！`, 'system', itemsDataOfAllObj[tripleMatch.want_item_id].user_id, Date.now().toString(), tripleMatch.required_item_id]
        )
      })
    }
    if (msgArr.length > 0) {
      const newMatchMsgInsertionCounts = await msgDAO.insert({
        action: 'insertNewMatchMsg',
        msgArr: msgArr,
      })
      if (newMatchMsgInsertionCounts !==
        (wantOfThirdItemsToCurUserItems.length * 2
          + wantOfSecondUserToCurUserItems.length)) {
        console.log(`insertion msg counts is not normal, 
        insetion counts is ${newMatchMsgInsertionCounts}, 
        tripleMatchMsgCount is ${wantOfThirdItemsToCurUserItems.length * 2} 
        and doubleMatchMsgCount is ${wantOfSecondUserToCurUserItems.length}`);
      }
    }
  }
}

function getUserWantByToken(token) {
  return wantDAO.get({
    action: 'getUserWantByToken',
    token: token,
  });
}

async function getItemsWantByItemIds(curUserWantArr) {
  // 整理剛剛取的的 second_item_id
  let secondItemIdArr = curUserWantArr.map(curWant => curWant.required_item_id);
  // 取得 secondItemWantArr
  let secondItemWantArr = await wantDAO.get({
    action: 'getItemsWantByItemIds',
    id_Arr: secondItemIdArr,
  });
  return secondItemWantArr
}

function getDoubleMatchArr(curUserWantArr, secondItemWantArr) {
  let doubleMatchResultArr = [];
  for (let i = 0; i < curUserWantArr.length; i++) {
    for (let j = 0; j < secondItemWantArr.length; j++) {
      if (curUserWantArr[i].required_item_id === secondItemWantArr[j].want_item_id
        && curUserWantArr[i].want_item_id === secondItemWantArr[j].required_item_id) {
        doubleMatchResultArr.push({
          curUserWant: {
            item_id: curUserWantArr[i].want_item_id,
            checked: curUserWantArr[i].checked
          },
          secondUserWant: {
            item_id: secondItemWantArr[j].want_item_id,
            checked: secondItemWantArr[j].checked
          },
        }) // 裡面有兩個 item_id, 以及 want 的 check 狀態
        break;
      }
    }
  }
  return doubleMatchResultArr;
}

function getCombinedWants(secondItemWantArr, curUserWantArr) {
  let combinedWantArr = [];
  for (let i = 0; i < secondItemWantArr.length; i++) {
    for (let j = 0; j < curUserWantArr.length; j++) {
      if (curUserWantArr[j].required_item_id === secondItemWantArr[i].want_item_id) {
        combinedWantArr.push({
          want_item_id: curUserWantArr[j].want_item_id, // 把第一個 want 的頭當成新 want 的頭
          curUserWantStatus: curUserWantArr[j].checked,
          second_item_id: secondItemWantArr[i].want_item_id, // 紀錄兩個原始的 want 結合點的共同 item_id
          secondUserWantStatus: secondItemWantArr[i].checked,
          required_item_id: secondItemWantArr[i].required_item_id, // 把第二個 want 的尾當成新 want 的尾
        })
      }
    }
  }
  return combinedWantArr
}

function checkTripleMatchOfWants(combinedWantArr, thirdItemWantArr) {
  let tripleMatchResultArr = [];
  for (let i = 0; i < combinedWantArr.length; i++) {
    for (let j = 0; j < thirdItemWantArr.length; j++) {
      if (combinedWantArr[i].required_item_id === thirdItemWantArr[j].want_item_id
        && combinedWantArr[i].want_item_id === thirdItemWantArr[j].required_item_id) {
        tripleMatchResultArr.push({
          curUserWant: {
            item_id: combinedWantArr[i].want_item_id,
            checked: combinedWantArr[i].curUserWantStatus,
          },
          secondUserWant: {
            item_id: combinedWantArr[i].second_item_id,
            checked: combinedWantArr[i].secondUserWantStatus,
          },
          thirdUserWant: {
            item_id: combinedWantArr[i].required_item_id,
            checked: thirdItemWantArr[j].checked
          },
        }) // 裡面有三個item_id, 以及 want 的 check 狀態
        break;
      }
    }
  }
  return tripleMatchResultArr;
}

async function getItemsData(...args) {
  let dataIdArr = [];
  for (let i = 0; i < args.length; i++) {
    args[i].forEach(match => {
      for (want in match) {
        if (dataIdArr.indexOf(match[want].item_id) === -1) {
          dataIdArr.push(match[want].item_id)
        }
      }
    })
  }

  let itemsDataArr;
  if (dataIdArr.length > 0) {
    itemsDataArr = await itemDAO.get({
      type: 'all',
      id_Arr: dataIdArr,
    })
  } else {
    itemsDataArr = [];
  }
  return itemsDataArr
}

async function getTripleMatchArr(secondItemWantArr, curUserWantArr) {
  let combinedWantArr = getCombinedWants(secondItemWantArr, curUserWantArr)
  let thirdItemWantArr = await getItemsWantByItemIds(combinedWantArr);
  // 確認有沒有 Triple Match
  let tripleMatchResultArr = checkTripleMatchOfWants(combinedWantArr, thirdItemWantArr)
  return tripleMatchResultArr;
}

async function sendMsgToRelatedUser(id_Arr, insertedMatchId) {
  // 3.取得製作通知訊息的資訊 (被通知物品id、被通知人暱稱、下架物品id、下架物品 title)
  let notificationList = await wantDAO.get({ id_Arr })
  // 3.1 過濾通知名單，製作 msg 內容
  // 取得通知配對成功名單 && 配對取消名單
  let insertMsgQueryDataArr = [];
  notificationList.forEach(notification => {
    if (id_Arr.indexOf(notification.notificated_item_id) === -1) {
      insertMsgQueryDataArr.push([`哭哭！您以"${notification.notificated_item_title}"對"${notification.gone_item_title}"的交換請求，因該物品下架已被取消><`, 'system', notification.notificated_user, notification.gone_item_id, null, Date.now().toString(), ' '])
    } else {
      insertMsgQueryDataArr.push([`恭喜！您以"${notification.notificated_item_title}"對"${notification.gone_item_title}"的交換請求已成立～交換編號為${insertedMatchId}，現在就打開"對話"頁面，和對方討論交換細節吧！`, 'system', notification.notificated_user, notification.gone_item_id, insertedMatchId, Date.now().toString(), '/matches/confirmed/'])
    }
  })
  // 3.2 將 msg 插入 message table 
  let insertedRowsCount = 0;
  if (insertMsgQueryDataArr.length > 0) {
    insertedRowsCount = await msgDAO.insert({ insertMsgQueryDataArr })
  }
  if (insertedRowsCount !== insertMsgQueryDataArr.length) {
    console.log('something wrong when inserting gone msg in msgDAO');
    console.log('insertedRowsCount')
    console.log(insertedRowsCount)
    console.log('insertMsgQueryDataArr.length')
    console.log(insertMsgQueryDataArr.length)
  }
}

async function discontinueItem(id_Arr, insertedMatchId) {
  let updateAvailabilitiesCount = await itemDAO.update({ id_Arr, insertedMatchId })
  if (updateAvailabilitiesCount !== id_Arr.length) {
    console.log('updateAvailabilitiesCount is not identical with id_Arr.length, updateAvailabilitiesCount is :');
    console.log(updateAvailabilitiesCount);
  }
}

async function wantConfirmTransaction(curUserItemId, required_item_id) {
  return new Promise((resolve, reject) => {
    mysql.pool.getConnection(async (err, con) => {
      if (err) { con.release(); }
      con.beginTransaction(async (err) => {
        if (err) { con.rollback(() => { con.release() }) }
        // 更新 want 的 confirm 狀態
        await wantDAO.updateWantToConfirm(curUserItemId, required_item_id, con).catch(err => {
          res.status(500).send({ errorMsg: '資料庫錯誤' })
          reject(err)
        });
        // 取得配對結果
        let matchResult = await wantDAO.checkDoubleMatch(curUserItemId, required_item_id, con)
        if (!matchResult.msg) {
          matchResult = await wantDAO.checkTripleMatch(curUserItemId, required_item_id, con)
        }
        if (matchResult.msg) {
          // 整理配對物品ID
          let id_Arr = [parseInt(curUserItemId), parseInt(required_item_id)];
          if (matchResult.msg === 'tripleConfirmedMatch') { id_Arr.push(matchResult.itemC_idArr[0]) }
          const insertedMatchId = await matchDAO.insert({ id_Arr });
          // 用ID下架配對物品
          await discontinueItem(id_Arr, insertedMatchId).catch((err) => {
            con.rollback(() => { con.release() })
            reject(err)
          })
          // 傳送配對訊息
          await sendMsgToRelatedUser(id_Arr, insertedMatchId).catch((err) => {
            con.rollback(() => { con.release() })
            reject(err)
          })
          // 回傳訊息給客戶端
          resolve({ msg: '配對成功！商品已自動為您下架，請至"對話"頁面查詢配對結果～' })
        } else {
          resolve({ msg: '目前尚未配對成功，請耐心等候～' })
        }
        con.commit((err) => {
          if (err) { con.rollback(() => { con.release() }) }
        })
        con.release()
      })
    })
  })
}

module.exports = router;
