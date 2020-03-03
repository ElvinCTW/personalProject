const mysql = require('../util/mysql');

module.exports = {
  insert: (queryData) => {
    return new Promise((resolve, reject) => {
      if (queryData.action === 'insertNewWant') {
        let insertWantsArr = [];
        queryData.wantArr.forEach(wantItemID => {
          // make want row
          let wantRow = [parseInt(wantItemID), parseInt(queryData.required_item_id)];
          // push in arr
          insertWantsArr.push(wantRow)
        });
        mysql.pool.query('INSERT INTO want(want_item_id, required_item_id) VALUES ?', [insertWantsArr], (err, insertWantResult, fields) => {
          if (err) {
            console.log('error in insertWantPromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          } else {
            // if success, send back success msg
            resolve(insertWantResult);
            // console.log('insert item success');
          }
        })
      } else {
        reject('no such action')
      }
    });
  },
  get: (queryData) => {
    // settings
    return new Promise((resolve, reject) => {
      if (queryData.action === 'getItemsWantByItemIds') {
        getWantOfItemsByItemIds(queryData.id_Arr,(output)=>{
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.action === 'getUserWantByToken') {
        // JOIN users u2 ON u2.id = i2.user_id 
        getUserWantByToken(queryData.token,(output)=>{
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.action === 'getUserSelectedItemIdArr') {
        getUserSelectedItemIdArr(queryData.item_id, queryData.user_nickname, (output)=>{
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.action === 'getSendMsgList') {
        getSendMsgList(queryData.id_Arr, (output)=>{
          if (output.result) {
            resolve(output.result)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.action === 'checkCurWantMatchable') {
        // 查詢新增的 want 有沒有兩人或三人配對可供確認
        let parseIntArr = [];
        queryData.wantArr.forEach((item_id) => {
          parseIntArr.push(parseInt(item_id));
        })
        // A = current user , B = item_deatil page owner, C = other
        // B_nickname 在裡面
        // 尋找反向 ( second_user want cur_user) 的 want
        // getWantBetweenItemIds(wantItemIdArr, requiredItemIdArr) 
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
  update: (queryData) => {
    // 更新 want/checked column
    // console.log('queryData');
    // console.log(queryData);
    return new Promise((resolve, reject) => {
      console.log('update, wantDAO');
      let queryString = `UPDATE want SET checked = ? WHERE want_item_id = ? AND required_item_id = ?`;
      let queryCondition = [queryData.type, queryData.want_item_id, queryData.required_item_id]
      // console.log('queryCondition');
      // console.log(queryCondition);
      mysql.pool.query(queryString, queryCondition, (err, updateCheckedResult, fileds) => {
        if (err) {
          mysql.errLog(err, 'updateCheckedPromise', 'wantDAO')
          reject(err);
        } else {
          // console.log('updateCheckedResult');
          // console.log(updateCheckedResult);
          // resolve(updateMatchResult);
          // 檢查 double 是否成功配對 :
          queryString = `SELECT w.required_item_id, w.want_item_id FROM want w WHERE w.want_item_id = ? AND w.required_item_id = ? AND w.checked = "confirm"`;
          queryCondition.length = 0
          queryCondition.push(queryData.required_item_id, queryData.want_item_id)
          // console.log('queryCondition');
          // console.log(queryCondition);
          mysql.pool.query(queryString, queryCondition, (err, doubleSelectMatchResult, fileds) => {
            if (err) {
              mysql.errLog(err, 'doubleSelectMatchResult', 'wantDAO')
              reject(err);
            } else {
              // console.log('doubleSelectMatchResult');
              // console.log(doubleSelectMatchResult);
              if (doubleSelectMatchResult.length > 0) {
                // console.log('double confirmed match, update item availability');
                // 若 double confirmed match，優先配對，不執行三方配對
                resolve({
                  msg: 'doubleConfirmedMatch',
                });
              } else {
                // 檢查 Triple confirmed match
                /* 
                為了在許多 triple confirmed match 之中選擇一個做配對，之後要 ORDER BY time 來選取最早的 want 作為判斷依據
                */
                queryString = `SELECT * FROM want WHERE ( want_item_id = ? AND checked = "confirm") OR (required_item_id = ? AND checked = "confirm")`;
                // queryCondition.length = 0
                // queryCondition.push(queryData.want_item_id, queryData.required_item_id)
                // console.log('queryCondition');
                // console.log(queryCondition);
                mysql.pool.query(queryString, queryCondition, (err, getConfirmedwantResult, fileds) => {
                  if (err) {
                    mysql.errLog(err, 'getConfirmedwantResult', 'wantDAO')
                    reject(err);
                  } else {
                    // console.log('getConfirmedwantResult');
                    // console.log(getConfirmedwantResult);
                    wantC_Arr = [];
                    wantC_Arr2 = [];
                    getConfirmedwantResult.forEach(want => {
                      // console.log(want.want_item_id);
                      // console.log(parseInt(queryData.required_item_id));
                      if (want.want_item_id === parseInt(queryData.required_item_id)) {
                        wantC_Arr.push(want.required_item_id);
                      } else {
                        wantC_Arr2.push(want.want_item_id);
                      }
                    })
                    // console.log(wantC_Arr);
                    // console.log(wantC_Arr2);
                    let itemC_idArr = wantC_Arr.filter(value => wantC_Arr2.includes(value))
                    // console.log('itemC_idArr');
                    // console.log(itemC_idArr);
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
              }
            }
          })
        }
      })
    })
  }
}

function getWantOfItemsByItemIds(itemIds, cb){
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
    if (err) {
      mysql.errLog(err,arguments.callee.toString(),__filename)
      cb({err})
    } else {
      cb({result})
    }
  });
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
      mysql.errLog(err,arguments.callee.toString(),__filename)
      cb({err})
    } else {
      cb({result})
    }
  });
}

function getUserSelectedItemIdArr(item_id, user_nickname,cb) {
  let queryString = 
  `SELECT i.id FROM want w 
  JOIN items i ON i.id = w.want_item_id 
  JOIN users u ON i.user_id = u.id 
  WHERE w.required_item_id = ? 
  AND u.nickname = ?`
  let queryCondition = [item_id, user_nickname];
  mysql.pool.query(queryString, queryCondition, (err, result, fileds) => {
    if (err) {
      mysql.errLog(err,arguments.callee.toString(),__filename)
      cb({err})
    } else {
      cb({result})
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
      mysql.errLog(err,arguments.callee.toString(),__filename)
      cb({err})
    } else {
      cb({result})
    }
  });
}

// function getWantBetweenItemIds(firstIds, secondIds) {
//   queryString = 
//   `SELECT w.*
//   FROM want w 
//   JOIN items i ON i.id = w.want_item_id 
//   JOIN users u ON i.user_id = u.id 
//   JOIN items i2 ON i2.id = w.required_item_id 
//   WHERE w.want_item_id in (?) 
//   AND w.required_item_id in (?) 
//   AND i.availability = "true"
//   AND i2.availability = "true"`;
//   queryCondition = [firstIds, secondIds];
//   mysql.advancedQuery({
//     queryString: queryString,
//     queryCondition: queryCondition,
//     queryName: '',
//     DAO_name: '',
//     reject: reject,
//   },()=>{
//     resolve()
//   })
// }