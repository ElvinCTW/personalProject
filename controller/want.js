/* eslint-disable require-jsdoc */
const {getUserDataByToken} = require('../model/user');
const {getWantOfItemsByItemIds, insertNewWant} = require('../model/want');
const {getItemDataByIdArr} = require('../model/item');
const {appendTagsToItemData} = require('../model/tag');
const {getUserWantByToken} = require('../model/want');

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

module.exports = {
  insertNewWantProcess: async (req, res) => {
    if (!req.body.token || !req.body.requiredItem || !req.body.wantItemsArr) {
      res.status(400).send('lack of required information');
    } else {
      // 用 token 辨識使用者
      const checkUserResult = await getUserDataByToken(req.body.token)
          .catch((err) => {
            console.log(err); res.status(500).send(); return;
          });
      if (checkUserResult.length === 1) { // 轉換資料為數字
        const secondItemId = parseInt(req.body.requiredItem);
        const intCurUserItemsIdArr = req.body.wantItemsArr.split(',')
            .map((itemId) => parseInt(itemId));
        // 取得邀請查詢結果與第三人物品ID
        const {
          wantOfSecondUserToCurUserItems,
          wantOfThirdItemsToCurUserItems,
          thirdItemsIds,
        } = await getInvitationMatchResult(secondItemId, intCurUserItemsIdArr);
        // 建立當前 user's want
        const newWantInsertResult =
        await insertNewWant(intCurUserItemsIdArr, secondItemId)
            .catch((err) => {
              console.log(err); res.status(500).send(); return;
            });
        // 取得物品資料
        const itemsDataOfAllObj =
        await getRelatedItemsData(thirdItemsIds, intCurUserItemsIdArr, secondItemId)
            .catch((err) => {
              console.log(err); res.status(500).send(); return;
            });
        // 傳送通知訊息
        await sendMsgToMatchers(wantOfSecondUserToCurUserItems,
            wantOfThirdItemsToCurUserItems,
            itemsDataOfAllObj,
            secondItemId,
            checkUserResult)
            .catch((err) => {
              console.log(err);
            }); // 對 user 影響不大，不停止 response
        // Send back success or fail msg
        res.send({
          msg: `配對結果: 已新增 ${newWantInsertResult.affectedRows} 筆交換邀請,
          為您找到 ${wantOfSecondUserToCurUserItems.length} 組雙人配對,
          找到 ${wantOfThirdItemsToCurUserItems.length} 組三人配對`,
        });
      } else {
        res.status(403).send('cannot find user with this token');
      }
    }
  },
  getMatchesCheckData: async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const curUserWantArr = await getUserWantByToken(token)
        .catch((err) => {
          console.log(err); res.status(500).send(); return;
        });
    let doubleMatchResultArr = [];
    let tripleMatchResultArr = [];
    if (curUserWantArr.length === 0) {
      res.send({doubleMatchResultArr, tripleMatchResultArr});
    } else {
      const secondItemWantArr =
      await getWantOfItemsByItemIds(curUserWantArr
          .map((curWant) => curWant.required_item_id))
          .catch((err) => {
            console.log(err); res.status(500).send(); return;
          });
      if (secondItemWantArr.length === 0) {
        res.send({doubleMatchResultArr, tripleMatchResultArr});
      } else {
        // 排除空查詢後處理資料
        let itemsDataArr;
        doubleMatchResultArr = getDoubleMatchArr(curUserWantArr, secondItemWantArr);
        await getTripleMatchArr(secondItemWantArr, curUserWantArr)
            .then((result) => {
              tripleMatchResultArr = result;
              return getItemsData(doubleMatchResultArr, result);
            })
            .then((result) => {
              itemsDataArr = result;
            })
            .catch((err) => {
              console.log(err); res.status(500).send(); return;
            });
        res.send({doubleMatchResultArr, tripleMatchResultArr, itemsDataArr});
      }
    }
  },
};
