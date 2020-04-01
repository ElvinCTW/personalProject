/* eslint-disable require-jsdoc */
const {getUserDataByToken} = require('../model/user');
const {
  getWantOfItemsByItemIds,
  insertNewWant,
  getUserWantByToken,
} = require('../model/want');
const {
  getInvitationMatchResult,
  getRelatedItemsData,
  sendMsgToMatchers,
  getDoubleMatchArr,
  getTripleMatchArr,
  getItemsData,
  wantConfirmTransaction,
  getWantsArrAndHashWantsObj,
} = require('../controller/wantSubfunctions');

async function insertNewWantProcess(req, res) {
  // Send 400 back if lack of user required information
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
}

async function getMatchesCheckDataProcess(req, res) {
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
}

async function getSelectedItemsProcess(req, res) {
  const {getUserSelectedItemIdArr} = require('../model/want');
  const userSelectedItemIdArr =
  await getUserSelectedItemIdArr(req.query.requiredItemId, req.query.nickname)
      .catch((err) => {
        console.log(err); res.status(500).send(); return;
      });
  const lastSelectionArr = userSelectedItemIdArr.map((obj) => obj.id);
  res.send(lastSelectionArr);
}

async function confirmTradeProcess(req, res) {
  const {wantItemId, requiredItemId} = req.body;
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
}

async function getInvitationPageDataProcess(req, res) {
  const token = req.headers.authorization.split(' ')[1];
  // get data
  const response = await getWantsArrAndHashWantsObj(token)
      .catch((err) => {
        console.log(err); res.status(500).send(); return;
      });
  res.send(response);
}

module.exports = {
  insertNewWantProcess,
  getMatchesCheckDataProcess,
  getSelectedItemsProcess,
  confirmTradeProcess,
  getInvitationPageDataProcess,
};
