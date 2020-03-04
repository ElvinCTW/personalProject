module.exports = {
  getWantOfItemsByItemIds,
  get: (queryData) => {
    // settings
    return new Promise((resolve, reject) => {
      if (queryData.firstIds && queryData.secondIds) {
        getWantBetweenItemIds(queryData.firstIds, queryData.secondIds, (output) => {
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.action === 'getUserWantByToken') {
        // JOIN users u2 ON u2.id = i2.user_id 
        getUserWantByToken(queryData.token, (output) => {
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.action === 'getUserSelectedItemIdArr') {
        getUserSelectedItemIdArr(queryData.item_id, queryData.user_nickname, (output) => {
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.id_Arr) {
        getSendMsgList(queryData.id_Arr, (output) => {
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.action === 'checkCurWantMatchable') {
        // 查詢新增的 want 有沒有兩人或三人配對可供確認
        // let parseIntArr = [];
        // queryData.wantArr.forEach((item_id) => {
        //   parseIntArr.push(parseInt(item_id));
        // })
        // A = current user , B = item_deatil page owner, C = other
        // B_nickname 在裡面
        // 尋找反向 ( second_user want cur_user) 的 want
        queryString =
          `SELECT w.*, u.id B_id, i2.title A_title 
        FROM want w 
        JOIN items i ON i.id = w.want_item_id 
        JOIN users u ON i.user_id = u.id 
        JOIN items i2 ON i2.id = w.required_item_id 
        WHERE w.want_item_id = ? 
        AND w.required_item_id in (?) 
        AND i.availability = "true"`;
        queryCondition = [queryData.item_id, parseIntArr];
        mysql.pool.query(queryString, queryCondition, (err, doubleMatchResultArr, fileds) => {
          console.log("doubleMatchResultArr");
          console.log(doubleMatchResultArr);
          if (err) {
            console.log('error in doubleMatchResultPromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          } else {
            // C_nickname, C_title, A_title 缺 B_nickname
            // getWant
            queryString =
              `SELECT w.*, u.id C_id, i.title C_title, i2.title A_title 
            FROM want w 
            JOIN items i ON i.id = w.want_item_id 
            JOIN users u ON i.user_id = u.id 
            JOIN items i2 ON i2.id = w.required_item_id 
            WHERE w.want_item_id 
            IN ( 
              SELECT w1.required_item_id 
              FROM want w1 
              JOIN items i3 ON i3.id = w1.required_item_id 
              WHERE w1.want_item_id = ? 
              AND i3.availability = "true" 
            ) 
            AND w.required_item_id in (?) 
            AND i.availability = "true"`;
            mysql.pool.query(queryString, queryCondition, (err, tripleMatchResultArr, fileds) => {
              if (err) {
                console.log('error in tripleMatchResultPromise');
                console.log(err.sqlMessage);
                console.log(err.sql);
                reject(err);
              } else {
                resolve({
                  doubleMatchResultArr: doubleMatchResultArr,
                  tripleMatchResultArr: tripleMatchResultArr,
                });
              }
            })
          }
        })
      } else {
        // console.log('search item wish list in wantDAO by item_id');
        // mysql.advancedQuery({
        //   queryString: `SELECT * FROM want JOIN items i ON i.id = want.required_item_id WHERE want_item_id = ? AND i.availability = "true"`,
        //   queryCondition: [queryData.item_id],
        //   queryName: 'checkPreviousWant',
        //   DAO_name: 'wantDAo',
        //   reject: reject,
        // },(checkPreviousWant)=>{
        //   resolve(checkPreviousWant)
        // })
      }
    })
  },
  insertNewWant,
  getWantBetweenItemIds,
  updateWantToConfirm,
  checkTripleMatch,
  checkDoubleMatch,
}

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
    mysql.pool.query(string, condition, (err, result, fileds) => {
      if (err) {
        let functionName = arguments.callee.toString();
        functionName = functionName.substr('function '.length);
        functionName = functionName.substr(0, functionName.indexOf('('));
        mysql.errLog(err, functionName, __filename)
        reject(error)
      } else {
        resolve(result)
      }
    });
  })
}

const mysql = require('../util/mysql');

function updateWantToConfirm(want_item_id, required_item_id, con) {
  return new Promise((resolve, reject) => {
    let queryString = `UPDATE want SET checked = "confirm" WHERE want_item_id = ? AND required_item_id = ?`;
    let queryCondition = [want_item_id, required_item_id]
    con.query(queryString, queryCondition, async (err, result, fileds) => {
      if (err) {
        con.rollback(() => { con.release() })
        mysql.errLog(err, 'updateCheckedPromise', 'wantDAO')
        reject(err);
      } else {
        resolve()
      }
    })
  })
}

async function checkTripleMatch(required_item_id, curUserItemId, con) {
  return new Promise((resolve, reject) => {
    // 取得可能組成 triple match 的 want
    let queryString =
      `SELECT * FROM want 
      WHERE ( want_item_id = ? AND checked = "confirm") 
      OR (required_item_id = ? AND checked = "confirm")`;
    let queryCondition = [required_item_id, curUserItemId]
    con.query(queryString, queryCondition, (err, getConfirmedwantResult, fileds) => {
      if (err) {
        con.rollback(() => { con.release() })
        mysql.errLog(err, 'getConfirmedwantResult', 'wantDAO')
        reject(err)
      } else {
        wantC_Arr = [];
        wantC_Arr2 = [];
        getConfirmedwantResult.forEach(want => {
          if (want.want_item_id === parseInt(required_item_id)) {
            wantC_Arr.push(want.required_item_id);
          } else {
            wantC_Arr2.push(want.want_item_id);
          }
        })
        let itemC_idArr = wantC_Arr.filter(value => wantC_Arr2.includes(value))
        if (itemC_idArr.length > 0) {
          resolve({
            msg: 'tripleConfirmedMatch',
            itemC_idArr: itemC_idArr,
          })
        } else {
          resolve({});
        }
      }
    })
  })
}

function insertNewWant(wantItemsIdArr, requiredItemId) {
  return new Promise((resolve, reject) => {
    let insertWantsArr = [];
    wantItemsIdArr.forEach(wantItemID => {
      // make want row
      let wantRow = [parseInt(wantItemID), parseInt(requiredItemId)];
      // push in arr
      insertWantsArr.push(wantRow)
    });
    let string = `INSERT INTO want(want_item_id, required_item_id) VALUES ?`;
    let condition = insertWantsArr;
    mysql.pool.query(string, [condition], (err, result, fileds) => {
      if (err) {
        let functionName = arguments.callee.toString();
        functionName = functionName.substr('function '.length);
        functionName = functionName.substr(0, functionName.indexOf('('));
        mysql.errLog(err, functionName, __filename)
        reject(err)
      } else {
        resolve(result)
      }
    });
  });
}

async function checkDoubleMatch(curUserItemId, required_item_id, con) {
  // 檢查 double 是否成功配對 :
  return new Promise((resolve, reject) => {
    let queryString = `SELECT w.required_item_id, w.want_item_id FROM want w WHERE w.want_item_id = ? AND w.required_item_id = ? AND w.checked = "confirm"`;
    let queryCondition = [required_item_id, curUserItemId]
    con.query(queryString, queryCondition, async (err, doubleSelectMatchResult, fileds) => {
      if (err) {
        con.rollback(() => { con.release() })
        mysql.errLog(err, 'doubleSelectMatchResult', 'wantDAO')
        reject(err);
      } else {
        if (doubleSelectMatchResult.length > 0) {
          resolve({ msg: 'doubleConfirmedMatch' })
        } else {
          resolve({})
        }
      }
    })
  })
}

function getWantOfItemsByItemIds(itemIds, cb) {
  return new Promise((resolve,reject)=>{
    let queryString =
      `SELECT w.* 
    FROM want w 
    JOIN items i ON i.id = w.want_item_id 
    JOIN items i2 ON i2.id = w.required_item_id
    WHERE i.id in (?)
    AND i.availability = "true" 
    AND i2.availability = "true"`;
    let queryCondition = [itemIds];
    mysql.pool.query(queryString, queryCondition, (err, result, fileds) => {
      let functionName = arguments.callee.toString();
      functionName = functionName.substr('function '.length);
      functionName = functionName.substr(0, functionName.indexOf('('));
      if (err) {
        mysql.errLog(err, functionName, __filename)
        reject(err)
      } else {
        resolve(result)
      }
    });
  })
}

function getUserWantByToken(token, cb) {
  let queryString =
    `SELECT w.*  
  FROM want w 
  JOIN items i ON i.id = w.want_item_id 
  JOIN items i2 ON i2.id = w.required_item_id 
  JOIN users u ON u.id = i.user_id 
  WHERE u.token = ? 
  AND i.availability = "true" 
  AND i2.availability = "true"`;
  let queryCondition = [token];
  mysql.pool.query(queryString, queryCondition, (err, result, fileds) => {
    if (err) {
      let functionName = arguments.callee.toString();
      functionName = functionName.substr('function '.length);
      functionName = functionName.substr(0, functionName.indexOf('('));
      mysql.errLog(err, functionName, __filename)
      cb({ err })
    } else {
      cb({ result })
    }
  });
}

function getUserSelectedItemIdArr(item_id, user_nickname, cb) {
  let queryString =
    `SELECT i.id FROM want w 
  JOIN items i ON i.id = w.want_item_id 
  JOIN users u ON i.user_id = u.id 
  WHERE w.required_item_id = ? 
  AND u.nickname = ?`
  let queryCondition = [item_id, user_nickname];
  mysql.pool.query(queryString, queryCondition, (err, result, fileds) => {
    if (err) {
      let functionName = arguments.callee.toString();
      functionName = functionName.substr('function '.length);
      functionName = functionName.substr(0, functionName.indexOf('('));
      mysql.errLog(err, functionName, __filename)
      cb({ err })
    } else {
      cb({ result })
    }
  });
}

function getSendMsgList(idArr, cb) {
  let queryString =
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
  let queryCondition = [idArr];
  mysql.pool.query(queryString, queryCondition, (err, result, fileds) => {
    if (err) {
      let functionName = arguments.callee.toString();
      functionName = functionName.substr('function '.length);
      functionName = functionName.substr(0, functionName.indexOf('('));
      mysql.errLog(err, functionName, __filename)
      cb({ err })
    } else {
      cb({ result })
    }
  });
}