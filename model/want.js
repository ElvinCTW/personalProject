/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
const {pool} = require('../util/mysql');

function getWantBetweenItemIds(firstIds, secondIds) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT w.*
      FROM want w 
      JOIN items i ON i.id = w.want_item_id 
      JOIN users u ON i.user_id = u.id 
      JOIN items i2 ON i2.id = w.required_item_id 
      WHERE w.want_item_id in (?) 
      AND w.required_item_id in (?) 
      AND i.availability = "true"
      AND i2.availability = "true"`;
    const condition = [firstIds, secondIds];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err); return;
      }
      resolve(result);
    });
  });
}

function updateWantToConfirm(wantItemId, requiredItemId, con) {
  return new Promise((resolve, reject) => {
    const queryString =
    `UPDATE want SET confirmed = 1
    WHERE want_item_id = ?
    AND required_item_id = ?`;
    const queryCondition = [wantItemId, requiredItemId];
    con.query(queryString, queryCondition, async (err) => {
      if (err) {
        reject(err); con.rollback(() => {
          con.release();
        }); return;
      }
      resolve();
    });
  });
}

async function checkTripleMatch(curUserItemId, requiredItemId, con) {
  return new Promise((resolve, reject) => {
    // 取得可能組成 triple match 的 confirmed want
    const queryString =
      `SELECT * FROM want 
      WHERE ( want_item_id = ? AND confirmed = 1) 
      OR (required_item_id = ? AND confirmed = 1)`;
    const queryCondition = [requiredItemId, curUserItemId];
    con.query(queryString, queryCondition, (err, result) => {
      if (err) {
        reject(err); con.rollback(() => {
          con.release();
        }); return;
      }
      const wantC_Arr = [];
      const wantC_Arr2 = [];
      result.forEach((want) => {
        if (want.want_item_id === parseInt(requiredItemId)) {
          wantC_Arr.push(want.required_item_id);
        } else {
          wantC_Arr2.push(want.want_item_id);
        }
      });
      const itemC_idArr = wantC_Arr.filter((id) => wantC_Arr2.includes(id));
      if (itemC_idArr.length > 0) {
        resolve({
          msg: 'tripleConfirmedMatch',
          itemC_idArr: itemC_idArr,
        });
      } else {
        resolve({});
      }
    });
  });
}

function insertNewWant(wantItemsIdArr, requiredItemId) {
  return new Promise((resolve, reject) => {
    const insertWantsArr = [];
    wantItemsIdArr.forEach((wantItemID) => {
      // make want row
      const wantRow = [parseInt(wantItemID), parseInt(requiredItemId)];
      // push in arr
      insertWantsArr.push(wantRow);
    });
    const string = 'INSERT INTO want(want_item_id, required_item_id) VALUES ?';
    const condition = insertWantsArr;
    pool.query(string, [condition], (err, result) => {
      if (err) {
        reject(err); return;
      }
      resolve(result);
    });
  });
}

async function checkDoubleMatch(curUserItemId, requiredItemId, con) {
  // 檢查 double 是否成功配對 :
  return new Promise((resolve, reject) => {
    const queryString =
    `SELECT w.required_item_id, w.want_item_id
    FROM want w WHERE w.want_item_id = ? 
    AND w.required_item_id = ? AND w.confirmed = 1`;
    const queryCondition = [requiredItemId, curUserItemId];
    con.query(queryString, queryCondition, async (err, result) => {
      if (err) {
        reject(err); con.rollback(() => {
          con.release();
        }); return;
      }
      const response = result.length > 0 ? {msg: 'doubleConfirmedMatch'} : {};
      resolve(response);
    });
  });
}

function getWantOfItemsByItemIds(itemIds) {
  return new Promise((resolve, reject) => {
    const queryString =
      `SELECT w.* 
    FROM want w 
    JOIN items i ON i.id = w.want_item_id 
    JOIN items i2 ON i2.id = w.required_item_id
    WHERE i.id in (?)
    AND i.availability = "true" 
    AND i2.availability = "true"`;
    const queryCondition = [itemIds];
    pool.query(queryString, queryCondition, (err, result) => {
      if (err) {
        reject(err); return;
      }
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
      if (err) {
        reject(err); return;
      }
      resolve(result);
    });
  });
}

function getUserSelectedItemIdArr(itemId, userNickname) {
  return new Promise((resolve, reject) => {
    const queryString =
      `SELECT i.id FROM want w 
      JOIN items i ON i.id = w.want_item_id 
      JOIN users u ON i.user_id = u.id 
      WHERE w.required_item_id = ? 
      AND u.nickname = ?`;
    const queryCondition = [itemId, userNickname];
    pool.query(queryString, queryCondition, (err, result) => {
      if (err) {
        reject(err); return;
      }
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
      AND w.confirmed = 1`;
    const queryCondition = [idArr];
    con.query(queryString, queryCondition, (err, result) => {
      if (err) {
        reject(err); return;
      }
      resolve(result);
    });
  });
}

function insertMatchRecord(idArr) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    if (idArr) {
      if (idArr.length === 3) {
        queryString =
        `INSERT INTO
        matches(start_item_id, middle_item_id, end_item_id)
        VALUES(?)`;
      } else if (idArr.length === 2) {
        queryString =
        `INSERT INTO matches(start_item_id, end_item_id)
        VALUES(?)`;
      }
      pool.query(queryString, [idArr], (err, result) => {
        if (err) {
          reject(err); return;
        }
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
      AND w.confirmed = 0
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
      AND w.confirmed = 0
      AND i.availability = "true"
      AND i2.availability = "true"`;
      condition = [token];
    }
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err); return;
      }
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
  insertNewWant,
  getWantBetweenItemIds,
  updateWantToConfirm,
  checkTripleMatch,
  checkDoubleMatch,
};
