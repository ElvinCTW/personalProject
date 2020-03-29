/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */
const express = require('express');
const router = express.Router();
const {
  insertNewWantProcess,
  getMatchesCheckData,
} = require('../controller/want');
const {getWantOfItemsByItemIds, insertNewWant} = require('../model/want');
const {getUserDataByToken} = require('../model/user');
const {getItemDataByIdArr} = require('../model/item');
const {appendTagsToItemData} = require('../model/tag');

// item_detail page 建立 want 用
router.post('/new', insertNewWantProcess);
// want 配對頁面讀取未成立交換資料用
router.get('/check', getMatchesCheckData);
// 配對頁面按下確認鍵時用
router.post('/checked', async (req, res) => {
  const {wantItemId, requiredItemId} = req.body;
  const {updateWantToConfirm} = require('../model/want');
  const token = req.headers.authorization.split(' ')[1];
  const itemId = parseInt(req.body.want_item_id);
  const userCheck = await getUserDataByToken(token, itemId)
      .catch((err) => {
        console.log(err); res.status(500).send(); return;
      });

  if (userCheck.length > 0) {
    const response = await wantConfirmTransaction(wantItemId, requiredItemId);
    res.send(response);
  } else {
    res.status(403).send();
  }

  async function wantConfirmTransaction(curUserItemId, requiredItemId) {
    const {checkDoubleMatch,
      checkTripleMatch,
      insertMatchRecord,
      getSendMsgList} = require('../model/want');
    const {insertMatchedMsg} = require('../model/msg');
    const {discontinueItem} = require('../model/item');
    const {pool} = require('../util/mysql');

    return new Promise((resolve) => {
      pool.getConnection(async (err, con) => {
        if (err) {
          con.release(); return;
        }
        con.beginTransaction(async (err) => {
          if (err) {
            con.rollback(() => {
              con.release();
            }); return;
          }
          // 更新 want 的 confirm 狀態
          await updateWantToConfirm(curUserItemId, requiredItemId, con)
              .catch((err) => {
                console.log(err); res.status(500).send(); return;
              });
          // 取得配對結果
          let matchResult =
          await checkDoubleMatch(curUserItemId, requiredItemId, con)
              .catch((err) => {
                console.log(err); res.status(500).send(); return;
              });
          if (!matchResult.msg) {
            matchResult =
            await checkTripleMatch(curUserItemId, requiredItemId, con)
                .catch((err) => {
                  console.log(err); res.status(500).send(); return;
                });
          }
          if (matchResult.msg) {
            // 整理配對物品ID & 新增成交紀錄
            const idArray = [parseInt(curUserItemId), parseInt(requiredItemId)];
            if (matchResult.msg === 'tripleConfirmedMatch') {
              idArray.push(matchResult.itemC_idArr[0]);
            }
            const insertedMatchId = await insertMatchRecord(idArray)
                .catch((err) => {
                  console.log(err); res.status(500).send(); return;
                });
            // 用ID下架配對物品
            await discontinueItem(idArray, insertedMatchId, con)
                .catch((err) => {
                  console.log(err); res.status(500).send(); return;
                });
            // 傳送配對訊息
            await sendMsgToRelatedUser(idArray, insertedMatchId, con)
                .catch((err) => {
                  console.log(err);
                });
            // 回傳訊息給客戶端
            resolve({msg: '成交！商品已自動為您下架，請至"成交紀錄"頁面查詢觀看成交紀錄～'});
          } else {
            resolve({msg: '已為您送出確認，請等候其他用戶確認～'});
          }
          con.commit((err) => {
            if (err) {
              con.rollback(() => {
                con.release();
              });
            }
          });
          con.release();
        });
      });
    });
    async function sendMsgToRelatedUser(idArray, insertedMatchId, con) {
      // 3.取得製作通知訊息的資訊 (被通知物品id、被通知人暱稱、下架物品id、下架物品 title)
      const notificationList = await getSendMsgList(idArray, con);

      // 3.1 過濾通知名單，製作 msg 內容
      // 取得通知配對成功名單 && 配對取消名單
      const insertMsgQueryDataArr = [];
      notificationList.forEach((notification) => {
        if (idArray.indexOf(notification.notificated_item_id) === -1) {
          insertMsgQueryDataArr.push(
              [`哭哭！您以"${notification.notificated_item_title}"對"${notification.gone_item_title}"的交換配對，因該物品下架已被取消><`,
                4,
                notification.notificated_user,
                notification.gone_item_id,
                null,
                ' ']);
        } else {
          insertMsgQueryDataArr.push(
              [`恭喜！您以"${notification.notificated_item_title}"對
              "${notification.gone_item_title}"的交換已成交～
              交換編號為 ${insertedMatchId} 號，現在就打開"成交紀錄"頁面，和對方討論交換細節吧！`,
              4,
              notification.notificated_user,
              notification.gone_item_id,
              insertedMatchId,
              '/matches/confirmed/']);
        }
      });
      // 3.2 將 msg 插入 message table
      let insertedRowsCount = 0;
      if (insertMsgQueryDataArr.length > 0) {
        insertedRowsCount = await insertMatchedMsg(insertMsgQueryDataArr);
      }
      if (insertedRowsCount !== insertMsgQueryDataArr.length) {
        console.log('something wrong when inserting gone msg in msg');
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
  const {getUserSelectedItemIdArr} = require('../model/want');
  const userSelectedItemIdArr =
  await getUserSelectedItemIdArr(req.query.requiredItemId, req.query.nickname)
      .catch((err) => {
        console.log(err); res.status(500).send(); return;
      });
  const lastSelectionArr = userSelectedItemIdArr.map((obj) => obj.id);
  res.send(lastSelectionArr);
});

router.get('/invitation', async (req, res) => {
  const {getReversedWants, getUserWantByToken} = require('../model/want');
  const token = req.headers.authorization.split(' ')[1];
  // get data
  const response = await getWantsArrAndHashWantsObj(token)
      .catch((err) => {
        console.log(err); res.status(500).send(); return;
      });
  res.send(response);

  async function getWantsArrAndHashWantsObj(token) {
    // get wants from db
    const wantArrToCurUser = await getReversedWants(token);
    let wantArrFromCurUser = await getUserWantByToken(token); // 1
    if (wantArrToCurUser.length === 0 && wantArrFromCurUser.length === 0) {
      return {
        hashedInvitationArrFromCurUser: {},
        hashedPosibleInvitationArrToCurUser: {},
        hashedDataCollection: {},
      };
    } else if (wantArrToCurUser.length === 0) {
      wantArrFromCurUser = wantArrFromCurUser.map((obj) => { // 2
        return {
          want_item_id: obj.want_item_id,
          required_item_id: obj.required_item_id,
        };
      });
      const hashedInvitationArrFromCurUser =
      hashWantArrObjMaker(wantArrFromCurUser, true); // 5
      wantArrFromCurUser =
      wantArrFromCurUser.map((obj) => Object.values(obj)).flat(); // 3
      let dataCollection =
      await getItemDataByIdArr(wantArrFromCurUser); // 取得資料 // 4
      dataCollection = await appendTagsToItemData(dataCollection);
      const hashedDataCollection = dataCollection.reduce((acu, data) => { // 6
        acu[data.id] = data;
        return acu;
      }, {});
      return ({ // 7
        hashedInvitationArrFromCurUser,
        hashedPosibleInvitationArrToCurUser: {},
        hashedDataCollection,
      });
    } else if (wantArrFromCurUser.length === 0) {
      const wantArrToReversedSecondUser =
      await getReversedWants(token, wantArrToCurUser
          .map((obj) => obj.want_item_id));
      const hashedWantsObjToCurUser =
      hashWantArrObjMaker(wantArrToCurUser);
      if (wantArrToReversedSecondUser.length === 0) {
        // 把每個 want value 變成 array 並回傳 [[]]，之後合併 arraies 並打平成為純數字 array
        const allItemsIdArr = wantArrToCurUser
            .map((want) => Object.values(want)).flat();
        const uniqueAllItemsIdArr = [...new Set(allItemsIdArr)]; // 去除重複
        let dataCollection =
        await getItemDataByIdArr(uniqueAllItemsIdArr); // 取得資料 // 4
        dataCollection = await appendTagsToItemData(dataCollection);
        // 整理 curUser 的潛在配對
        const hashedPosibleInvitationArrToCurUser =
        hashWantArrObjMaker(wantArrToCurUser, true);
        const hashedDataCollection = dataCollection.reduce((acu, data) => { // 6
          acu[data.id] = data;
          return acu;
        }, {});
        return ({ // 7
          hashedInvitationArrFromCurUser: {},
          hashedPosibleInvitationArrToCurUser,
          hashedDataCollection,
        });
      } else {
        const hashedWantsObjToReversedSecondUser =
        hashWantArrObjMaker(wantArrToReversedSecondUser);
        const joinedWantFromReversedThirdToCurUser = [];
        // 組合相乘得到所有的 reversed third item to cur user item wants
        for (const [wantItemId, requiredItemIdArr] of
          Object.entries(hashedWantsObjToReversedSecondUser)) {
          requiredItemIdArr.forEach((requiredItemId) =>
            hashedWantsObjToCurUser[requiredItemId].forEach((curUserItemId) =>
              joinedWantFromReversedThirdToCurUser.push({
                want_item_id: parseInt(wantItemId),
                middle_item_id: requiredItemId,
                required_item_id: curUserItemId,
              }),
            ));
        }
        // 把每個 want value 變成 array 並回傳 [[]]，之後合併 arraies 並打平成為純數字 array
        const allItemsIdArr = wantArrToCurUser
            .map((want) => Object.values(want))
            .concat(joinedWantFromReversedThirdToCurUser
                .map((want) => Object.values(want)))
            .flat();
        const uniqueAllItemsIdArr = [...new Set(allItemsIdArr)]; // 去除重複
        let dataCollection =
        await getItemDataByIdArr(uniqueAllItemsIdArr); // 取得資料 // 4
        dataCollection = await appendTagsToItemData(dataCollection);
        // 整理 curUser 的潛在配對
        const hashedPosibleInvitationArrToCurUser =
        hashWantArrObjMaker(wantArrToCurUser
            .concat(joinedWantFromReversedThirdToCurUser), true);
        const hashedDataCollection = dataCollection.reduce((acu, data) => { // 6
          acu[data.id] = data;
          return acu;
        }, {});
        return ({ // 7
          hashedInvitationArrFromCurUser: {},
          hashedPosibleInvitationArrToCurUser,
          hashedDataCollection,
        });
      }
    }
    // want_item_id 已排除 curUser item
    const wantArrToReversedSecondUser =
    await getReversedWants(token, wantArrToCurUser
        .map((obj) => obj.want_item_id));
    // let wantArrFromCurUser = await getUserWantByToken(token); // 1
    wantArrFromCurUser = wantArrFromCurUser.map((obj) => { // 2
      return {
        want_item_id: obj.want_item_id,
        required_item_id: obj.required_item_id,
      };
    });
    // hash wantArr data
    const hashedWantsObjToCurUser =
    hashWantArrObjMaker(wantArrToCurUser);
    const hashedWantsObjToReversedSecondUser =
    hashWantArrObjMaker(wantArrToReversedSecondUser);
    const hashedWantsObjFromCurUser = hashWantArrObjMaker(wantArrFromCurUser);
    const joinedWantFromReversedThirdToCurUser = [];
    // 組合相乘得到所有的 reversed third item to cur user item wants
    for (const [wantItemId, requiredItemIdArr] of
      Object.entries(hashedWantsObjToReversedSecondUser)) {
      requiredItemIdArr.forEach((requiredItemId) =>
        hashedWantsObjToCurUser[requiredItemId].forEach((curUserItemId) =>
          joinedWantFromReversedThirdToCurUser.push({
            want_item_id: parseInt(wantItemId),
            middle_item_id: requiredItemId,
            required_item_id: curUserItemId,
          }),
        ));
    }
    // 整理 Id 以取得資料集
    const doubleNoMatchedWantToCurUserArr =
    filterOutMatchedWants(hashedWantsObjFromCurUser, wantArrToCurUser);
    const tripleNoMatchedWantToCurUserArr =
    filterOutMatchedWants(hashedWantsObjFromCurUser,
        joinedWantFromReversedThirdToCurUser);
    // 把每個 want value 變成 array 並回傳 [[]]，之後合併 arraies 並打平成為純數字 array
    const allItemsIdArr = doubleNoMatchedWantToCurUserArr
        .map((want) => Object.values(want))
        .concat(tripleNoMatchedWantToCurUserArr
            .map((want) => Object.values(want)))
        .concat(wantArrFromCurUser
            .map((want) => Object.values(want)))
        .flat();
    const uniqueAllItemsIdArr = [...new Set(allItemsIdArr)]; // 去除重複
    let dataCollection = await getItemDataByIdArr(uniqueAllItemsIdArr);
    dataCollection = await appendTagsToItemData(dataCollection);
    // 整理 curUser 的潛在配對
    const hashedPosibleInvitationArrToCurUser =
    hashWantArrObjMaker(doubleNoMatchedWantToCurUserArr
        .concat(tripleNoMatchedWantToCurUserArr), true);
    const hashedInvitationArrFromCurUser =
    hashWantArrObjMaker(wantArrFromCurUser, true); // 5
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
     * @param {object} hashedWantsObjFromCurUser
     * ^^ key = curUser item id , value = required_item_id of curUser item id
     * @param {array} arrOfWantObjToCurUser required_item_id = cur user items id
     * @return {array} invitations without already matches
     */
    function filterOutMatchedWants(hashedWantsObjFromCurUser, arrOfWantObjToCurUser) {
      return arrOfWantObjToCurUser.filter((wantObj) =>
        // 如果 curUser 的某商品還沒有送出過 want invitation
        !hashedWantsObjFromCurUser[wantObj.required_item_id] ||
        // 確認 curUser 的某商品的 required items 中不包含在要回傳的 want 之中
        hashedWantsObjFromCurUser[wantObj.required_item_id]
            .indexOf(wantObj.want_item_id) === -1);
    }

    /**
     * @param {array} wantArr
     * @param {boolean} result true for result / flase(or empty) for process
     * @return {object} hash-table of want
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
