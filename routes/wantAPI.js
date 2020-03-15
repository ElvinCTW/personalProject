const express = require('express');
const router = express.Router();
const { getWantOfItemsByItemIds, insertNewWant } = require('../dao/wantDAO');
const { getUserDataByToken } = require('../dao/user');
const { getItemDataByIdArr } = require('../dao/item');

// item_detail page 建立 want 用
router.post('/new', async (req, res) => {
  if (!req.body.token || !req.body.required_item || !req.body.want_items_Arr) {
    res.status(400).send('lack of required information');
  } else {
    // 用 token 辨識使用者
    const checkUserResult = await getUserDataByToken(req.body.token)
      .catch(err => { console.log(err); res.status(500).send(); return; });
    if (checkUserResult.length === 1) {      // 轉換資料為數字
      const secondItemId = parseInt(req.body.required_item);
      const intCurUserItemsIdArr = req.body.want_items_Arr.split(',').map(item_id => parseInt(item_id));
      // 取得邀請查詢結果與第三人物品ID
      const { wantOfSecondUserToCurUserItems, wantOfThirdItemsToCurUserItems, thirdItemsIds }
        = await getInvitationMatchResult(secondItemId, intCurUserItemsIdArr);
      // 建立當前 user's want
      const newWantInsertResult = await insertNewWant(intCurUserItemsIdArr, secondItemId).catch(err => { console.log(err); res.status(500).send(); return; });
      // 取得物品資料
      const itemsDataOfAllObj = await getRelatedItemsData(thirdItemsIds, intCurUserItemsIdArr, secondItemId).catch(err => { console.log(err); res.status(500).send(); return; });
      // 傳送通知訊息
      await sendMsgToMatchers(wantOfSecondUserToCurUserItems, wantOfThirdItemsToCurUserItems, itemsDataOfAllObj, secondItemId, checkUserResult).catch(err => { console.log(err); }); // 對 user 影響不大，不停止 response
      // Send back success or fail msg
      res.send({
        msg: ` 配對結果: \n 已新增 ${newWantInsertResult.affectedRows} 筆交換邀請, \n 為您找到 ${wantOfSecondUserToCurUserItems.length} 組雙人配對, \n 找到 ${wantOfThirdItemsToCurUserItems.length} 組三人配對`
      });
    } else {
      res.status(403).send('cannot find user with this token');
    }
  }

  async function getInvitationMatchResult(secondItemId, intCurUserItemsIdArr) {
    const { getWantBetweenItemIds } = require('../dao/wantDAO');
    const wantOfSecondUserToCurUserItems = await getWantBetweenItemIds([secondItemId], intCurUserItemsIdArr);
    const wantOfsecondItemToThirdItems = await getWantOfItemsByItemIds(secondItemId);
    const thirdItemsIds = wantOfsecondItemToThirdItems.map(want => want.required_item_id);
    const wantOfThirdItemsToCurUserItems = thirdItemsIds.length > 0 ? await getWantBetweenItemIds(thirdItemsIds, intCurUserItemsIdArr) : [];
    return {
      wantOfSecondUserToCurUserItems,
      wantOfThirdItemsToCurUserItems,
      thirdItemsIds,
    };
  }
  async function getRelatedItemsData(thirdItemsIds, intCurUserItemsIdArr, secondItemId) {
    let itemsIdOfAll = thirdItemsIds.concat(intCurUserItemsIdArr);
    itemsIdOfAll.push(secondItemId);
    const itemsDataOfAll = await getItemDataByIdArr(itemsIdOfAll);
    const itemsDataOfAllObj = {};
    itemsDataOfAll.forEach(data => {
      itemsDataOfAllObj[data.id] = data;
    });
    return itemsDataOfAllObj;
  }
  async function sendMsgToMatchers(wantOfSecondUserToCurUserItems, wantOfThirdItemsToCurUserItems, itemsDataOfAllObj, secondItemId, checkUserResult) {
    const { sendMsgToNoMatcher, insertNewMatchMsg } = require('../dao/msgDAO');
    let msgArr = [];
    if (wantOfSecondUserToCurUserItems.length === 0 &&
      wantOfThirdItemsToCurUserItems.length === 0) {
      const insertCount = await sendMsgToNoMatcher({
        content: `您的物品"${itemsDataOfAllObj[secondItemId].title}"收到了來自"${checkUserResult[0].nickname}"的新交換邀請，快到"邀請查詢"頁面查看一下吧`,
        receiver: itemsDataOfAllObj[secondItemId].user_id,
        sender: 'system',
        time: Date.now().toString(),
        link: '/want/invitation'
      });
      if (insertCount !== 1) { console.log('insertCount not equal to 1, it is ' + insertCount); }
    } else {
      if (wantOfSecondUserToCurUserItems.length > 0) {
        wantOfSecondUserToCurUserItems.forEach(doubleMatch => {
          // 通知 second user 配對成立
          msgArr.push([`已建立您對"${itemsDataOfAllObj[doubleMatch.required_item_id].title}"的一組新兩人配對，快到"配對查詢"頁面確認吧！`, 'system', itemsDataOfAllObj[doubleMatch.want_item_id].user_id, Date.now().toString(), doubleMatch.required_item_id]);
        });
      }
      if (wantOfThirdItemsToCurUserItems.length > 0) {
        wantOfThirdItemsToCurUserItems.forEach(tripleMatch => {
          // 通知 second & third user 配對成立
          msgArr.push(
            [`已建立您對"${itemsDataOfAllObj[tripleMatch.want_item_id].title}"的一組新三人配對，快到"配對查詢"頁面確認吧！`, 'system', itemsDataOfAllObj[secondItemId].user_id, Date.now().toString(), tripleMatch.want_item_id],
            [`已建立您對"${itemsDataOfAllObj[tripleMatch.required_item_id].title}"的一組新三人配對，快到"配對查詢"頁面確認吧！`, 'system', itemsDataOfAllObj[tripleMatch.want_item_id].user_id, Date.now().toString(), tripleMatch.required_item_id]
          );
        });
      }
      if (msgArr.length > 0) {
        const newMatchMsgInsertionCounts = await insertNewMatchMsg(msgArr);
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
});

// want 配對頁面讀取未成立交換資料用
router.get('/check', async (req, res) => {
  const { getUserWantByToken } = require('../dao/wantDAO');
  const token = req.headers.authorization.split(' ')[1];
  const curUserWantArr = await getUserWantByToken(token)
    .catch(err => { console.log(err); res.status(500).send(); return; });
  let doubleMatchResultArr = [];
  let tripleMatchResultArr = [];
  if (curUserWantArr.length === 0) {
    res.send({ doubleMatchResultArr, tripleMatchResultArr });
  } else {
    const secondItemWantArr = await getWantOfItemsByItemIds(curUserWantArr.map(curWant => curWant.required_item_id))
      .catch(err => { console.log(err); res.status(500).send(); return; });
    if (secondItemWantArr.length === 0) {
      res.send({ doubleMatchResultArr, tripleMatchResultArr });
    } else {
      // 排除空查詢後處理資料
      let itemsDataArr;
      doubleMatchResultArr = getDoubleMatchArr(curUserWantArr, secondItemWantArr);
      await getTripleMatchArr(secondItemWantArr, curUserWantArr)
        .then((result) => {
          tripleMatchResultArr = result;
          return getItemsData(doubleMatchResultArr, result);
        })
        .then((result) => { itemsDataArr = result; })
        .catch(err => { console.log(err); res.status(500).send(); return; });
      res.send({ doubleMatchResultArr, tripleMatchResultArr, itemsDataArr });
    }
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
          }); // 裡面有兩個 item_id, 以及 want 的 check 狀態
          break;
        }
      }
    }
    return doubleMatchResultArr;
  }
  async function getTripleMatchArr(secondItemWantArr, curUserWantArr) {
    let combinedWantArr = getCombinedWants(secondItemWantArr, curUserWantArr);
    let thirdItemWantArr = await getWantOfItemsByItemIds(combinedWantArr.map(curWant => curWant.required_item_id));
    // 確認有沒有 Triple Match
    let tripleMatchResultArr = checkTripleMatchOfWants(combinedWantArr, thirdItemWantArr);
    return tripleMatchResultArr;

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
            });
          }
        }
      }
      return combinedWantArr;
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
            }); // 裡面有三個item_id, 以及 want 的 check 狀態
            break;
          }
        }
      }
      return tripleMatchResultArr;
    }
  }
  async function getItemsData(...args) {
    let dataIdArr = [];
    for (let i = 0; i < args.length; i++) {
      args[i].forEach(match => {
        for (let want in match) {
          if (dataIdArr.indexOf(match[want].item_id) === -1) {
            dataIdArr.push(match[want].item_id);
          }
        }
      });
    }
    let itemsDataArr = dataIdArr.length > 0 ? getItemDataByIdArr(dataIdArr) : [];
    return itemsDataArr;
  }
});

// 配對頁面按下確認鍵時用
router.post('/checked', async (req, res) => {
  const { want_item_id, required_item_id } = req.body;
  const { updateWantToConfirm } = require('../dao/wantDAO');
  const token = req.headers.authorization.split(' ')[1];
  const item_id = parseInt(req.body.want_item_id);
  const userCheck = await getUserDataByToken(token, item_id)
    .catch(err => { console.log(err); res.status(500).send(); return; });

  if (userCheck.length > 0) {
    const response = await wantConfirmTransaction(want_item_id, required_item_id);
    res.send(response);
  } else { res.status(403).send(); }

  async function wantConfirmTransaction(curUserItemId, required_item_id) {
    const { checkDoubleMatch, checkTripleMatch, insertMatchRecord, getSendMsgList } = require('../dao/wantDAO');
    const { insertMatchedMsg } = require('../dao/msgDAO');
    const { discontinueItem } = require('../dao/item');
    const { pool } = require('../util/mysql');

    return new Promise((resolve) => {
      pool.getConnection(async (err, con) => {
        if (err) { con.release(); return; }
        con.beginTransaction(async (err) => {
          if (err) { con.rollback(() => { con.release(); }); return; }
          // 更新 want 的 confirm 狀態
          await updateWantToConfirm(curUserItemId, required_item_id, con)
            .catch(err => { console.log(err); res.status(500).send(); return; });
          // 取得配對結果
          let matchResult = await checkDoubleMatch(curUserItemId, required_item_id, con)
            .catch(err => { console.log(err); res.status(500).send(); return; });
          if (!matchResult.msg) {
            matchResult = await checkTripleMatch(curUserItemId, required_item_id, con)
              .catch(err => { console.log(err); res.status(500).send(); return; });
          }
          if (matchResult.msg) {
            // 整理配對物品ID & 新增成交紀錄
            const id_Arr = [parseInt(curUserItemId), parseInt(required_item_id)];
            if (matchResult.msg === 'tripleConfirmedMatch') { id_Arr.push(matchResult.itemC_idArr[0]); }
            const insertedMatchId = await insertMatchRecord(id_Arr)
              .catch(err => { console.log(err); res.status(500).send(); return; });
            // 用ID下架配對物品
            await discontinueItem(id_Arr, insertedMatchId, con)
              .catch(err => { console.log(err); res.status(500).send(); return; });
            // 傳送配對訊息
            await sendMsgToRelatedUser(id_Arr, insertedMatchId, con)
              .catch(err => { console.log(err); });
            // 回傳訊息給客戶端
            resolve({ msg: '成交！商品已自動為您下架，請至"成交紀錄"頁面查詢觀看成交紀錄～' });
          } else {
            resolve({ msg: '已為您送出確認，請等候其他用戶確認～' });
          }
          con.commit((err) => {
            if (err) { con.rollback(() => { con.release(); }); }
          });
          con.release();
        });
      });
    });
    async function sendMsgToRelatedUser(id_Arr, insertedMatchId, con) {
      // 3.取得製作通知訊息的資訊 (被通知物品id、被通知人暱稱、下架物品id、下架物品 title)
      const notificationList = await getSendMsgList(id_Arr, con);

      // 3.1 過濾通知名單，製作 msg 內容
      // 取得通知配對成功名單 && 配對取消名單
      let insertMsgQueryDataArr = [];
      notificationList.forEach(notification => {
        if (id_Arr.indexOf(notification.notificated_item_id) === -1) {
          insertMsgQueryDataArr.push([`哭哭！您以"${notification.notificated_item_title}"對"${notification.gone_item_title}"的交換配對，因該物品下架已被取消><`, 'system', notification.notificated_user, notification.gone_item_id, null, Date.now().toString(), ' ']);
        } else {
          insertMsgQueryDataArr.push([`恭喜！您以"${notification.notificated_item_title}"對"${notification.gone_item_title}"的交換已成交～交換編號為 ${insertedMatchId} 號，現在就打開"成交紀錄"頁面，和對方討論交換細節吧！`, 'system', notification.notificated_user, notification.gone_item_id, insertedMatchId, Date.now().toString(), '/matches/confirmed/']);
        }
      });
      // 3.2 將 msg 插入 message table 
      let insertedRowsCount = 0;
      if (insertMsgQueryDataArr.length > 0) {
        insertedRowsCount = await insertMatchedMsg(insertMsgQueryDataArr);
      }
      if (insertedRowsCount !== insertMsgQueryDataArr.length) {
        console.log('something wrong when inserting gone msg in msgDAO');
        console.log('insertedRowsCount');
        console.log(insertedRowsCount);
        console.log('insertMsgQueryDataArr.length');
        console.log(insertMsgQueryDataArr.length);
      }
    }
  }
});

// item_detail page 取得先前已選擇過的物品清單用
router.get('/last', async (req, res) => {
  const { getUserSelectedItemIdArr } = require('../dao/wantDAO');
  let userSelectedItemIdArr = await getUserSelectedItemIdArr(req.query.required_item_id, req.query.user_nickname)
    .catch(err => { console.log(err); res.status(500).send(); return; });
  let lastSelectionArr = userSelectedItemIdArr.map(obj => obj.id);
  res.send(lastSelectionArr);
});

router.get('/invitation', async (req, res) => {
  const { getReversedWants, getUserWantByToken } = require('../dao/wantDAO');
  const token = req.headers.authorization.split(' ')[1];
  // get data
  const response = await getWantsArrAndHashWantsObj(token)
    .catch(err => { console.log(err); res.status(500).send(); return; });
  res.send(response);

  async function getWantsArrAndHashWantsObj(token) {
    // get wants from db
    const wantArrToCurUser = await getReversedWants(token);
    if (wantArrToCurUser.length===0) {
      let wantArrFromCurUser = await getUserWantByToken(token); // 1
      wantArrFromCurUser = wantArrFromCurUser.map((obj) => { // 2
        return {
          want_item_id: obj.want_item_id,
          required_item_id: obj.required_item_id,
        };
      });
      const hashedInvitationArrFromCurUser = hashWantArrObjMaker(wantArrFromCurUser, true); // 5
      wantArrFromCurUser = wantArrFromCurUser.map(obj=>Object.values(obj)).flat(); // 3
      let dataCollection = await getItemDataByIdArr(wantArrFromCurUser); // 取得資料 // 4
      const hashedDataCollection = dataCollection.reduce((acu, data) => { // 6
        acu[data.id] = data;
        return acu;
      }, {});
      return ({ // 7
        hashedInvitationArrFromCurUser,
        hashedPosibleInvitationArrToCurUser:{},
        hashedDataCollection,
      });
    }
    // want_item_id 已排除 curUser item
    const wantArrToReversedSecondUser = await getReversedWants(token, wantArrToCurUser.map(obj => obj.want_item_id));
    let wantArrFromCurUser = await getUserWantByToken(token); // 1
    wantArrFromCurUser = wantArrFromCurUser.map((obj) => { // 2
      return {
        want_item_id: obj.want_item_id,
        required_item_id: obj.required_item_id,
      };
    });
    // hash wantArr data
    const hashedWantsObjToCurUser = hashWantArrObjMaker(wantArrToCurUser); // {want_item_id: [required_item_id...], ...}
    const hashedWantsObjToReversedSecondUser = hashWantArrObjMaker(wantArrToReversedSecondUser);
    const hashedWantsObjFromCurUser = hashWantArrObjMaker(wantArrFromCurUser); // 3
    // let [key, value] of Object.entries(yourobject)
    let joinedWantFromReversedThirdToCurUser = [];
    // 組合相乘得到所有的 reversed third item to cur user item wants 
    for (let [wantItemId, requiredItemIdArr] of Object.entries(hashedWantsObjToReversedSecondUser)) {
      requiredItemIdArr.forEach(requiredItemId =>
        hashedWantsObjToCurUser[requiredItemId].forEach(curUserItemId =>
          joinedWantFromReversedThirdToCurUser.push({
            want_item_id: parseInt(wantItemId),
            middle_item_id: requiredItemId,
            required_item_id: curUserItemId,
          })
        ));
    }
    // 整理 Id 以取得資料集
    const doubleNoMatchedWantToCurUserArr = filterOutMatchedWants(hashedWantsObjFromCurUser, wantArrToCurUser);
    const tripleNoMatchedWantToCurUserArr = filterOutMatchedWants(hashedWantsObjFromCurUser, joinedWantFromReversedThirdToCurUser);
    // 把每個 want value 變成 array 並回傳 [[]]，之後合併 arraies 並打平成為純數字 array
    const allItemsIdArr = doubleNoMatchedWantToCurUserArr
      .map(want => Object.values(want))
      .concat(tripleNoMatchedWantToCurUserArr
        .map(want => Object.values(want)))
      .concat(wantArrFromCurUser
        .map(want => Object.values(want)))
      .flat();
    const uniqueAllItemsIdArr = [... new Set(allItemsIdArr)]; //去除重複
    let dataCollection = await getItemDataByIdArr(uniqueAllItemsIdArr); // 取得資料 // 4
    // 整理 curUser 的潛在配對
    const hashedPosibleInvitationArrToCurUser = hashWantArrObjMaker(doubleNoMatchedWantToCurUserArr.concat(tripleNoMatchedWantToCurUserArr), true);
    const hashedInvitationArrFromCurUser = hashWantArrObjMaker(wantArrFromCurUser, true); // 5
    const hashedDataCollection = dataCollection.reduce((acu, data) => { // 6
      acu[data.id] = data;
      return acu;
    }, {});
    return ({ // 7
      hashedInvitationArrFromCurUser,
      hashedPosibleInvitationArrToCurUser,
      hashedDataCollection,
    });

    /**
     * 剔除 wantObjArr 中可以和 curUser item 配對的 wants
     * @param {*} hashedWantsObjFromCurUser key = curUser item id , value = required_item_id of curUser item id
     * @param {*} arrOfWantObjToCurUser required_item_id = cur user items id
     */
    function filterOutMatchedWants(hashedWantsObjFromCurUser, arrOfWantObjToCurUser) {
      return arrOfWantObjToCurUser.filter(wantObj =>
        !hashedWantsObjFromCurUser[wantObj.required_item_id] ||  // 如果 curUser 的某商品還沒有送出過 want invitation
        hashedWantsObjFromCurUser[wantObj.required_item_id].indexOf(wantObj.want_item_id) === -1); // 確認 curUser 的某商品的 required items 中不包含在要回傳的 want 之中
    }

    /**
     * 
     * @param {*} wantArr 
     * @param {*} result true for result / flase(or empty) for process
     */
    function hashWantArrObjMaker(wantArr, result) {
      if (result) {
        return wantArr.reduce((acu, want) => {
          if (acu[want.want_item_id]) {
            acu[want.want_item_id].push(want);
          } else {
            acu[want.want_item_id] = [want];
          }
          return acu;
        }, {});
      } else {
        return wantArr.reduce((acu, want) => {
          if (acu[want.want_item_id]) {
            acu[want.want_item_id].push(want.required_item_id);
          } else {
            acu[want.want_item_id] = [want.required_item_id];
          }
          return acu;
        }, {});
      }
    }
  }
});

module.exports = router;
