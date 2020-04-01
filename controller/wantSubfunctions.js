/* eslint-disable require-jsdoc */
const {getItemDataByIdArr} = require('../model/item');
const {appendTagsToItemData} = require('../model/tag');
const {insertMatchedMsg} = require('../model/msg');
const {discontinueItem} = require('../model/item');
const {pool} = require('../util/mysql');
const {
  getReversedWants,
  getUserWantByToken,
  updateWantToConfirm,
  checkDoubleMatch,
  checkTripleMatch,
  insertMatchRecord,
  getSendMsgList,
  getWantOfItemsByItemIds,
} = require('../model/want');

async function getInvitationMatchResult(secondItemId, intCurUserItemsIdArr) {
  const {getWantBetweenItemIds} = require('../model/want');
  const wantOfSecondUserToCurUserItems =
    await getWantBetweenItemIds([secondItemId], intCurUserItemsIdArr);
  const wantOfsecondItemToThirdItems =
    await getWantOfItemsByItemIds(secondItemId);
  const thirdItemsIds = wantOfsecondItemToThirdItems
      .map((want) => want.required_item_id);
  const wantOfThirdItemsToCurUserItems = thirdItemsIds.length > 0 ?
    await getWantBetweenItemIds(thirdItemsIds, intCurUserItemsIdArr) : [];

  return {
    wantOfSecondUserToCurUserItems,
    wantOfThirdItemsToCurUserItems,
    thirdItemsIds,
  };
}

async function getRelatedItemsData(thirdItemsIds, intCurUserItemsIdArr, secondItemId) {
  const itemsIdOfAll = thirdItemsIds.concat(intCurUserItemsIdArr);
  itemsIdOfAll.push(secondItemId);
  const itemsDataOfAll = await getItemDataByIdArr(itemsIdOfAll);
  const itemsDataOfAllObj = {};
  itemsDataOfAll.forEach((data) => {
    itemsDataOfAllObj[data.id] = data;
  });
  return itemsDataOfAllObj;
}

async function sendMsgToMatchers(wantOfSecondUserToCurUserItems, wantOfThirdItemsToCurUserItems, itemsDataOfAllObj, secondItemId, checkUserResult) {
  const {sendMsgToNoMatcher, insertNewMatchMsg} = require('../model/msg');
  const msgArr = [];
  if (wantOfSecondUserToCurUserItems.length === 0 &&
    wantOfThirdItemsToCurUserItems.length === 0) {
    const insertCount = await sendMsgToNoMatcher({
      content: `您的物品"${itemsDataOfAllObj[secondItemId].title}"
      收到了來自"${checkUserResult[0].nickname}"的新交換邀請，快到"邀請查詢"頁面查看一下吧`,
      receiver: itemsDataOfAllObj[secondItemId].user_id,
      sender: 4,
      link: '/want/invitation',
    });
    if (insertCount !== 1) {
      console.log('insertCount not equal to 1, it is ' + insertCount);
    }
  } else {
    if (wantOfSecondUserToCurUserItems.length > 0) {
      wantOfSecondUserToCurUserItems.forEach((doubleMatch) => {
        // 通知 second user 配對成立
        msgArr.push(
            [`已建立您對"${itemsDataOfAllObj[doubleMatch.required_item_id].title}"的一組新兩人配對，
            快到"配對查詢"頁面確認吧！`,
            4,
            itemsDataOfAllObj[doubleMatch.want_item_id].user_id,
            doubleMatch.required_item_id]);
      });
    }
    if (wantOfThirdItemsToCurUserItems.length > 0) {
      wantOfThirdItemsToCurUserItems.forEach((tripleMatch) => {
        // 通知 second & third user 配對成立
        msgArr.push(
            [`已建立您對"${itemsDataOfAllObj[tripleMatch.want_item_id].title}"的一組新三人配對，
            快到"配對查詢"頁面確認吧！`,
            4,
            itemsDataOfAllObj[secondItemId].user_id,
            tripleMatch.want_item_id],
            [`已建立您對"${itemsDataOfAllObj[tripleMatch.required_item_id].title}"的一組新三人配對，
            快到"配對查詢"頁面確認吧！`,
            4,
            itemsDataOfAllObj[tripleMatch.want_item_id].user_id,
            tripleMatch.required_item_id],
        );
      });
    }
    if (msgArr.length > 0) {
      const newMatchMsgInsertionCounts = await insertNewMatchMsg(msgArr);
      if (newMatchMsgInsertionCounts !==
        (wantOfThirdItemsToCurUserItems.length * 2 +
          wantOfSecondUserToCurUserItems.length)) {
        console.log(`inserted msg counts is not normal, 
        inseted msg counts is ${newMatchMsgInsertionCounts}, 
        tripleMatchMsgCount is ${wantOfThirdItemsToCurUserItems.length * 2} 
        and doubleMatchMsgCount is ${wantOfSecondUserToCurUserItems.length}`);
      }
    }
  }
}

function getDoubleMatchArr(curUserWantArr, secondItemWantArr) {
  const doubleMatchResultArr = [];
  for (let i = 0; i < curUserWantArr.length; i++) {
    for (let j = 0; j < secondItemWantArr.length; j++) {
      if (curUserWantArr[i].required_item_id ===
        secondItemWantArr[j].want_item_id &&
        curUserWantArr[i].want_item_id ===
        secondItemWantArr[j].required_item_id) {
        doubleMatchResultArr.push({
          curUserWant: {
            item_id: curUserWantArr[i].want_item_id,
            confirmed: curUserWantArr[i].confirmed,
          },
          secondUserWant: {
            item_id: secondItemWantArr[j].want_item_id,
            confirmed: secondItemWantArr[j].confirmed,
          },
        }); // 裡面有兩個 item_id, 以及 want 的 check 狀態
        break;
      }
    }
  }
  return doubleMatchResultArr;
}

async function getTripleMatchArr(secondItemWantArr, curUserWantArr) {
  const combinedWantArr = getCombinedWants(secondItemWantArr, curUserWantArr);
  const thirdItemWantArr =
    await getWantOfItemsByItemIds(combinedWantArr
        .map((curWant) => curWant.required_item_id));
  // 確認有沒有 Triple Match
  const tripleMatchResultArr =
    checkTripleMatchOfWants(combinedWantArr, thirdItemWantArr);
  return tripleMatchResultArr;

  function getCombinedWants(secondItemWantArr, curUserWantArr) {
    const combinedWantArr = [];
    for (let i = 0; i < secondItemWantArr.length; i++) {
      for (let j = 0; j < curUserWantArr.length; j++) {
        if (curUserWantArr[j].required_item_id ===
          secondItemWantArr[i].want_item_id) {
          combinedWantArr.push({
            // 把第一個 want 的頭當成新 want 的頭
            want_item_id: curUserWantArr[j].want_item_id,
            curUserWantStatus: curUserWantArr[j].confirmed,
            // 紀錄兩個原始的 want 結合點的共同 item_id
            second_item_id: secondItemWantArr[i].want_item_id,
            secondUserWantStatus: secondItemWantArr[i].confirmed,
            // 把第二個 want 的尾當成新 want 的尾
            required_item_id: secondItemWantArr[i].required_item_id,
          });
        }
      }
    }
    return combinedWantArr;
  }

  function checkTripleMatchOfWants(combinedWantArr, thirdItemWantArr) {
    const tripleMatchResultArr = [];
    for (let i = 0; i < combinedWantArr.length; i++) {
      for (let j = 0; j < thirdItemWantArr.length; j++) {
        if (combinedWantArr[i].required_item_id ===
          thirdItemWantArr[j].want_item_id &&
          combinedWantArr[i].want_item_id ===
          thirdItemWantArr[j].required_item_id) {
          tripleMatchResultArr.push({
            curUserWant: {
              item_id: combinedWantArr[i].want_item_id,
              confirmed: combinedWantArr[i].curUserWantStatus,
            },
            secondUserWant: {
              item_id: combinedWantArr[i].second_item_id,
              confirmed: combinedWantArr[i].secondUserWantStatus,
            },
            thirdUserWant: {
              item_id: combinedWantArr[i].required_item_id,
              confirmed: thirdItemWantArr[j].confirmed,
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
  const dataIdArr = [];
  const {appendTagsToItemData} = require('../model/tag');
  for (let i = 0; i < args.length; i++) {
    args[i].forEach((match) => {
      for (const want in match) {
        if (dataIdArr.indexOf(match[want].item_id) === -1) {
          dataIdArr.push(match[want].item_id);
        }
      }
    });
  }
  let itemsDataArr = dataIdArr.length > 0 ?
    await getItemDataByIdArr(dataIdArr) : [];
  itemsDataArr = await appendTagsToItemData(itemsDataArr);
  return itemsDataArr;
}

async function wantConfirmTransaction(curUserItemId, requiredItemId) {
  return new Promise((resolve) => {
    pool.getConnection(async (err, con) => {
      if (err) {
        con.release();
        return;
      }
      con.beginTransaction(async (err) => {
        if (err) {
          con.rollback(() => {
            con.release();
          });
          return;
        }
        // 更新 want 的 confirm 狀態
        await updateWantToConfirm(curUserItemId, requiredItemId, con)
            .catch((err) => {
              console.log(err); res.status(500).send();
            });
        // 取得配對結果
        let matchResult =
          await checkDoubleMatch(curUserItemId, requiredItemId, con)
              .catch((err) => {
                console.log(err); res.status(500).send();
              });
        if (!matchResult.msg) {
          matchResult =
            await checkTripleMatch(curUserItemId, requiredItemId, con)
                .catch((err) => {
                  console.log(err); res.status(500).send();
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
                console.log(err); res.status(500).send();
              });
          // 用ID下架配對物品
          await discontinueItem(idArray, insertedMatchId, con)
              .catch((err) => {
                console.log(err); res.status(500).send();
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

async function getWantsArrAndHashWantsObj(token) {
  // get wants from db
  const wantArrToCurUser = await getReversedWants(token);
  let wantArrFromCurUser = await getUserWantByToken(token);
  // 沒人想要用戶物品，用戶也不想要別人物品
  if (wantArrToCurUser.length === 0 && wantArrFromCurUser.length === 0) {
    return {
      hashedInvitationArrFromCurUser: {},
      hashedPosibleInvitationArrToCurUser: {},
      hashedDataCollection: {},
    };
  } else if (wantArrToCurUser.length === 0) { // 當前用戶沒有未配對邀請
    return await getOnlyCurUserInvitation(wantArrFromCurUser);
  } else if (wantArrFromCurUser.length === 0) { // 用戶物品沒有邀請紀錄
    return await getOnlyOthersInvitation(wantArrToCurUser);
  } else { // want_item_id 已排除 curUser item
    // 由想要當前用戶物品的其他用戶出發，取得下一層用戶的 want
    const wantArrToReversedSecondUser =
      await getReversedWants(token, wantArrToCurUser
          .map((want) => want.want_item_id));
    wantArrFromCurUser = wantArrFromCurUser.map((want) => {
      return {
        want_item_id: want.want_item_id,
        required_item_id: want.required_item_id,
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

    // 打平 array 並整理為 hash table
    const allItemsIdArr = doubleNoMatchedWantToCurUserArr
        .map((want) => Object.values(want))
        .concat(tripleNoMatchedWantToCurUserArr
            .map((want) => Object.values(want)))
        .concat(wantArrFromCurUser
            .map((want) => Object.values(want)))
        .flat();
    const hashedDataCollection = await hashedItemsDataMaker(allItemsIdArr);

    // 製作回傳的 hash table
    const hashedPosibleInvitationArrToCurUser =
      hashWantArrObjMaker(doubleNoMatchedWantToCurUserArr
          .concat(tripleNoMatchedWantToCurUserArr), true);
    const hashedInvitationArrFromCurUser =
      hashWantArrObjMaker(wantArrFromCurUser, true);

    return ({
      hashedInvitationArrFromCurUser,
      hashedPosibleInvitationArrToCurUser,
      hashedDataCollection,
    });
  }
  /**
   * @param {array} wantArr
   * @param {boolean} forReturn true for retuen / flase(or empty) for process
   * @return {object} hash-table of want
   */
  function hashWantArrObjMaker(wantArr, forReturn) {
    if (forReturn) {
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

  async function hashedItemsDataMaker(allItemsIdArr) {
    const uniqueAllItemsIdArr = [...new Set(allItemsIdArr)]; // 去除重複
    let dataCollection =
    await getItemDataByIdArr(uniqueAllItemsIdArr);
    dataCollection = await appendTagsToItemData(dataCollection);

    return dataCollection.reduce((acu, data) => {
      acu[data.id] = data;
      return acu;
    }, {});
  }

  async function getOnlyCurUserInvitation(wantArrFromCurUser) {
    wantArrFromCurUser = wantArrFromCurUser.map((obj) => {
      return {
        want_item_id: obj.want_item_id,
        required_item_id: obj.required_item_id,
      };
    });
    const hashedInvitationArrFromCurUser =
      hashWantArrObjMaker(wantArrFromCurUser, true);
    const itemsIdArr =
      wantArrFromCurUser.map((want) => Object.values(want)).flat();
    const hashedDataCollection = await hashedItemsDataMaker(itemsIdArr);

    return ({ // 7
      hashedInvitationArrFromCurUser,
      hashedPosibleInvitationArrToCurUser: {},
      hashedDataCollection,
    });
  }

  async function getOnlyOthersInvitation(wantArrToCurUser) {
    // 檢查有沒有三人配對機會
    const wantArrToReversedSecondUser =
      await getReversedWants(token, wantArrToCurUser
          .map((obj) => obj.want_item_id));
    const hashedWantsObjToCurUser =
      hashWantArrObjMaker(wantArrToCurUser);
    const joinedWantFromReversedThirdToCurUser = [];

    if (wantArrToReversedSecondUser.length !== 0) { // 有三人配對機會
      const hashedWantsObjToReversedSecondUser =
      hashWantArrObjMaker(wantArrToReversedSecondUser);
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
    }
    // 取得 item id
    let allItemsIdArr;
    if (wantArrToReversedSecondUser.length === 0) { // 沒有三人配對機會
      allItemsIdArr = wantArrToCurUser
          .map((want) => Object.values(want)).flat();
    } else {
      allItemsIdArr = wantArrToCurUser
          .map((want) => Object.values(want))
          .concat(joinedWantFromReversedThirdToCurUser
              .map((want) => Object.values(want)))
          .flat();
    }
    // 製作 hash table
    let hashedPosibleInvitationArrToCurUser;
    if (wantArrToReversedSecondUser.length === 0) { // 沒有三人配對機會
      hashedPosibleInvitationArrToCurUser =
        hashWantArrObjMaker(wantArrToCurUser, true);
    } else {
      hashedPosibleInvitationArrToCurUser =
        hashWantArrObjMaker(wantArrToCurUser
            .concat(joinedWantFromReversedThirdToCurUser), true);
    }
    const hashedDataCollection = await hashedItemsDataMaker(allItemsIdArr);

    return ({ // 7
      hashedInvitationArrFromCurUser: {},
      hashedPosibleInvitationArrToCurUser,
      hashedDataCollection,
    });
  }
}


module.exports = {
  getInvitationMatchResult,
  getRelatedItemsData,
  sendMsgToMatchers,
  getDoubleMatchArr,
  getTripleMatchArr,
  getItemsData,
  wantConfirmTransaction,
  getWantsArrAndHashWantsObj,
};
