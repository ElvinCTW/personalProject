const { pool } = require('../util/mysql');

function getWantBetweenItemIds(firstIds, secondIds) {
  return new Promise((resolve, reject) => {
    let string =
      `SELECT w.*
    FROM want w 
    JOIN items i ON i.id = w.want_item_id 
    JOIN users u ON i.user_id = u.id 
    JOIN items i2 ON i2.id = w.required_item_id 
    WHERE w.want_item_id in (?) 
    AND w.required_item_id in (?) 
    AND i.availability = "true"
    AND i2.availability = "true"`;
    let condition = [firstIds, secondIds];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

function updateWantToConfirm(want_item_id, required_item_id, con) {
  return new Promise((resolve, reject) => {
    let queryString = 'UPDATE want SET checked = "confirm" WHERE want_item_id = ? AND required_item_id = ?';
    let queryCondition = [want_item_id, required_item_id];
    con.query(queryString, queryCondition, async (err) => {
      if (err) { reject(err); con.rollback(() => { con.release(); }); return; }
      resolve();
    });
  });
}

async function checkTripleMatch(curUserItemId, required_item_id, con) {
  return new Promise((resolve, reject) => {
    // 取得可能組成 triple match 的 confirmed want
    const queryString =
      `SELECT * FROM want 
      WHERE ( want_item_id = ? AND checked = "confirm") 
      OR (required_item_id = ? AND checked = "confirm")`;
    const queryCondition = [required_item_id, curUserItemId];
    con.query(queryString, queryCondition, (err, result) => {
      if (err) { reject(err); con.rollback(() => { con.release(); }); return; }
      let wantC_Arr = [];
      let wantC_Arr2 = [];
      result.forEach(want => {
        if (want.want_item_id === parseInt(required_item_id)) {
          wantC_Arr.push(want.required_item_id);
        } else {
          wantC_Arr2.push(want.want_item_id);
        }
      });
      const itemC_idArr = wantC_Arr.filter(id => wantC_Arr2.includes(id));
      if (itemC_idArr.length > 0) {
        resolve({
          msg: 'tripleConfirmedMatch',
          itemC_idArr: itemC_idArr,
        });
      } else { resolve({}); }
    });
  });
}

function insertNewWant(wantItemsIdArr, requiredItemId) {
  return new Promise((resolve, reject) => {
    let insertWantsArr = [];
    wantItemsIdArr.forEach(wantItemID => {
      // make want row
      let wantRow = [parseInt(wantItemID), parseInt(requiredItemId)];
      // push in arr
      insertWantsArr.push(wantRow);
    });
    let string = 'INSERT INTO want(want_item_id, required_item_id) VALUES ?';
    let condition = insertWantsArr;
    pool.query(string, [condition], (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

async function checkDoubleMatch(curUserItemId, required_item_id, con) {
  // 檢查 double 是否成功配對 :
  return new Promise((resolve, reject) => {
    let queryString = 'SELECT w.required_item_id, w.want_item_id FROM want w WHERE w.want_item_id = ? AND w.required_item_id = ? AND w.checked = "confirm"';
    let queryCondition = [required_item_id, curUserItemId];
    con.query(queryString, queryCondition, async (err, result) => {
      if (err) { reject(err); con.rollback(() => { con.release(); }); return; }
      let response = result.length > 0 ? { msg: 'doubleConfirmedMatch' } : {};
      resolve(response);
    });
  });
}

function getWantOfItemsByItemIds(itemIds) {
  return new Promise((resolve, reject) => {
    let queryString =
      `SELECT w.* 
    FROM want w 
    JOIN items i ON i.id = w.want_item_id 
    JOIN items i2 ON i2.id = w.required_item_id
    WHERE i.id in (?)
    AND i.availability = "true" 
    AND i2.availability = "true"`;
    let queryCondition = [itemIds];
    pool.query(queryString, queryCondition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

function getUserWantByToken(token) {
  return new Promise((resolve, reject) => {
    const queryString =
      `SELECT w.*
      FROM want w 
      JOIN items i ON i.id = w.want_item_id 
      JOIN items i2 ON i2.id = w.required_item_id 
      JOIN users u ON u.id = i.user_id 
      WHERE u.token = ? 
      AND i.availability = "true" 
      AND i2.availability = "true"`;
    const queryCondition = [token];
    pool.query(queryString, queryCondition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

function getUserSelectedItemIdArr(item_id, user_nickname) {
  return new Promise((resolve, reject) => {
    let queryString =
      `SELECT i.id FROM want w 
      JOIN items i ON i.id = w.want_item_id 
      JOIN users u ON i.user_id = u.id 
      WHERE w.required_item_id = ? 
      AND u.nickname = ?`;
    let queryCondition = [item_id, user_nickname];
    pool.query(queryString, queryCondition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

function getSendMsgList(idArr, con) {
  return new Promise((resolve, reject) => {
    const queryString =
      `SELECT w.want_item_id notificated_item_id, 
      i.title notificated_item_title, 
      u.id notificated_user, 
      w.required_item_id gone_item_id, 
      i2.title gone_item_title 
      FROM want w 
      JOIN items i ON i.id = w.want_item_id 
      JOIN items i2 ON i2.id = w.required_item_id 
      JOIN users u ON i.user_id = u.id
      WHERE w.required_item_id in (?) 
      AND w.checked = "confirm"`;
    const queryCondition = [idArr];
    con.query(queryString, queryCondition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

function insertMatchRecord(id_Arr) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    if (id_Arr) {
      if (id_Arr.length === 3) {
        queryString = 'INSERT INTO matches(start_item_id, middle_item_id, end_item_id) VALUES(?)';
      } else if (id_Arr.length === 2) {
        queryString = 'INSERT INTO matches(start_item_id, end_item_id) VALUES(?)';
      }
      pool.query(queryString, [id_Arr], (err, result) => {
        if (err) { reject(err); return; }
        resolve(result.insertId);
      });
    }
  });
}

/**
 * 取得潛在的 invitation for token owner
 * @param {*} token 
 */
function getReversedWants(token, secondIdArr) {
  return new Promise((resolve, reject) => {
    let string;
    let condition;
    if (secondIdArr) {
      string =
        `SELECT w.want_item_id,
      w.required_item_id
      FROM want w
      JOIN items i ON i.id = w.want_item_id
      JOIN items i2 ON i2.id = w.required_item_id
      JOIN users u ON u.id = i.user_id 
      WHERE u.token <> ?
      AND w.required_item_id in (?)
      AND w.checked = "pending"
      AND i.availability = "true"
      AND i2.availability = "true"`;
      condition = [token, secondIdArr];
    } else {
      string =
        `SELECT w.want_item_id,
      w.required_item_id 
      FROM want w
      JOIN items i ON i.id = w.required_item_id
      JOIN items i2 ON i2.id = w.want_item_id
      JOIN users u ON u.id = i.user_id
      WHERE u.token = ?
      AND w.checked = "pending"
      AND i.availability = "true"
      AND i2.availability = "true"`;
      condition = [token];
    }
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

module.exports = {
  getReversedWants,
  getWantOfItemsByItemIds,
  getUserWantByToken,
  insertMatchRecord,
  getUserSelectedItemIdArr,
  getSendMsgList,
  // get: (queryData) => {
  //   // settings
  //   return new Promise((resolve, reject) => {
  //     // 查詢新增的 want 有沒有兩人或三人配對可供確認
  //     // A = current user , B = item_deatil page owner, C = other
  //     // B_nickname 在裡面
  //     // 尋找反向 ( second_user want cur_user) 的 want
  //     let queryString =
  //       `SELECT w.*, u.id B_id, i2.title A_title 
  //       FROM want w 
  //       JOIN items i ON i.id = w.want_item_id 
  //       JOIN users u ON i.user_id = u.id 
  //       JOIN items i2 ON i2.id = w.required_item_id 
  //       WHERE w.want_item_id = ? 
  //       AND w.required_item_id in (?) 
  //       AND i.availability = "true"`;
  //     let queryCondition = [queryData.item_id, queryData.parseIntArr];
  //     pool.query(queryString, queryCondition, (err, doubleMatchResultArr) => {
  //       console.log('doubleMatchResultArr');
  //       console.log(doubleMatchResultArr);
  //       if (err) {
  //         console.log('error in doubleMatchResultPromise');
  //         console.log(err.sqlMessage);
  //         console.log(err.sql);
  //         reject(err);
  //       } else {
  //         // C_nickname, C_title, A_title 缺 B_nickname
  //         // getWant
  //         queryString =
  //           `SELECT w.*, u.id C_id, i.title C_title, i2.title A_title 
  //           FROM want w 
  //           JOIN items i ON i.id = w.want_item_id 
  //           JOIN users u ON i.user_id = u.id 
  //           JOIN items i2 ON i2.id = w.required_item_id 
  //           WHERE w.want_item_id 
  //           IN ( 
  //             SELECT w1.required_item_id 
  //             FROM want w1 
  //             JOIN items i3 ON i3.id = w1.required_item_id 
  //             WHERE w1.want_item_id = ? 
  //             AND i3.availability = "true" 
  //           ) 
  //           AND w.required_item_id in (?) 
  //           AND i.availability = "true"`;
  //         pool.query(queryString, queryCondition, (err, tripleMatchResultArr) => {
  //           if (err) {
  //             console.log('error in tripleMatchResultPromise');
  //             console.log(err.sqlMessage);
  //             console.log(err.sql);
  //             reject(err);
  //           } else {
  //             resolve({
  //               doubleMatchResultArr: doubleMatchResultArr,
  //               tripleMatchResultArr: tripleMatchResultArr,
  //             });
  //           }
  //         });
  //       }
  //     });
  //   });
  // },
  insertNewWant,
  getWantBetweenItemIds,
  updateWantToConfirm,
  checkTripleMatch,
  checkDoubleMatch,
};