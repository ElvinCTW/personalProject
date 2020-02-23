const mysql = require('../util/mysql');

module.exports = {
  insert: (queryData) => {
    return new Promise((resolve, reject) => {
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
    });
  },
  get: (queryData) => {
    // settings
    let parseIntArr = [];
    let queryString = '';
    let queryCondition = [];
    queryData.item_id = parseInt(queryData.item_id);
    if (queryData.action === 'getUserSelectedItemIdArr') {
      return new Promise((resolve, reject) => {
        let queryString = 'SELECT i.id FROM want w JOIN items i ON i.id = w.want_item_id JOIN users u ON i.user_id = u.id WHERE w.required_item_id = ? AND u.nickname = ?';
        let queryCondition = [queryData.item_id, queryData.user_nickname];
        mysql.pool.query(queryString, queryCondition, (err, userSelectedItemIdResult, fileds) => {
          if (err) {
            mysql.errLog(err, 'userSelectedItemIdResult', 'wantDAO')
            reject(err)
          } else {
            // console.log('userSelectedItemIdResult')
            // console.log(userSelectedItemIdResult)
            let resultArr = [];
            userSelectedItemIdResult.forEach(obj => {
              resultArr.push(obj.id);
            })
            // console.log('resultArr')
            // console.log(resultArr)
            resolve(resultArr);
          }
        });
      })
    } else if (queryData.id_Arr) {
      // console.log('search users that need to be notificate when other items gone, wantDAO, get');
      return new Promise((resolve, reject) => {
        // 取得 required item id in (id_Arr) && check = confirmed 的 want，作為通知人候選名單
        queryString = 'SELECT w.want_item_id notificated_item_id, i.title notificated_item_title, i.user_nickname notificated_user, w.required_item_id gone_item_id, i2.title gone_item_title FROM want w JOIN items i ON i.id = w.want_item_id JOIN items i2 ON i2.id = w.required_item_id WHERE w.required_item_id in (?) AND w.checked = "confirm"';
        queryCondition.length = 0;
        queryCondition.push(queryData.id_Arr);
        mysql.pool.query(queryString, queryCondition, (err, notificationResult, fileds) => {
          if (err) {
            mysql.errLog(err, 'notificationResult', 'wantDAO')
            reject(err)
          } else {
            // console.log('notificationResult')
            // console.log(notificationResult)
            resolve(notificationResult)
          }
        });
      })
    } else if (queryData.endItemsArr) {
      // 三方配對時，用 end_item 作為 want_item 搜尋 WishList，結果數字代表三方配對完成方式數量
    } else if (queryData.wantArr) {
      // console.log('search double or triple non-confirmed match in wantDAO');
      // 查詢 required_item 有無針對 offer_items 表示過 want (item_detail 新增 want 用)
      queryData.wantArr.forEach((item_id) => {
        parseIntArr.push(parseInt(item_id));
      })
      // A = current user , B = item_deatil page owner, C = other
      // B_nickname 在裡面
      queryString = `SELECT w.*, i.user_nickname B_nickname, i2.title A_title FROM want w JOIN items i ON i.id = w.want_item_id JOIN items i2 ON i2.id = w.required_item_id WHERE w.want_item_id = ? AND w.required_item_id in (?) AND i.availability = "true"`;
      queryCondition = [queryData.item_id, parseIntArr];
      return new Promise((resolve, reject) => {
        mysql.pool.query(queryString, queryCondition, (err, doubleMatchResultArr, fileds) => {
          // console.log(doubleMatchResultArr);
          if (err) {
            console.log('error in doubleMatchResultPromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          } else {
            // C_nickname, C_title, A_title 缺 B_nickname
            queryString = `SELECT w.*, i.user_nickname C_nickname, i.title C_title, i2.title A_title FROM want w JOIN items i ON i.id = w.want_item_id JOIN items i2 ON i2.id = w.required_item_id WHERE w.want_item_id IN ( SELECT w1.required_item_id FROM want w1 JOIN items i3 ON i3.id = w1.required_item_id WHERE w1.want_item_id = ? AND i3.availability = "true" ) AND w.required_item_id in (?) AND i.availability = "true"`;
            // return new Promise((resolve, reject) => {
            mysql.pool.query(queryString, queryCondition, (err, tripleMatchResultArr, fileds) => {
              // console.log(tripleMatchResultArr);
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
            // }) 
          }
        })
      })
    } else if (queryData.user_nickname || queryData.item_id) {
      let doubleMatchResultArr = [];
      let tripleMatchResultArr = [];
      /**
       * user_nickname query : A 是當前 user 資料，B 是 user 想要的資料， C 是想要 user 東西的資料
       * item_id query : A 是 user 想要的東西資料，B 是想要 user 東西的資料， C 是 user 的東西
       * => 以 query 條件的進入點為 A
       */
      // 查詢該會員的所有交易資料
      // 1. 用 user_nickname 取得 AwantB
      return new Promise((resolve, reject) => {
        if (!queryData.item_id) {
          // console.log('search match result of user in wantDAO');
          queryString = `SELECT want_item_id A_id, required_item_id B_id, i.title FROM want w JOIN items i ON w.want_item_id = i.id WHERE i.user_nickname = ? AND i.availability = "true"`
          queryCondition = [queryData.user_nickname]
        } else {
          // console.log('search match result of item_id in wantDAO');
          queryString = `SELECT w.required_item_id B_id, w.checked, i.* FROM want w JOIN items i ON w.required_item_id = i.id WHERE w.want_item_id = ? AND i.availability = "true"`
          queryCondition = [queryData.item_id]
        }
        // console.log('queryData');
        // console.log(queryData);
        // console.log('queryString')
        // console.log(queryString)
        // console.log('queryCondition');
        // console.log(queryCondition);
        mysql.pool.query(queryString, queryCondition, (err, AwantBtable, fileds) => {
          // console.log(AwantBtable);
          if (err) {
            console.log('error in AwantBtablePromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          } else {
            // console.log('AwantBtable.length === 0')
            // console.log(AwantBtable.length === 0)
            if (AwantBtable.length === 0) {
              resolve({
                doubleMatchResultArr: doubleMatchResultArr,
                tripleMatchResultArr: tripleMatchResultArr,
              })
            } else {
              // console.log('AwantBtable')
              // console.log(AwantBtable)
              // 2. 用 user_nickname 取得 CwantA , 並取得 DoubleMatchTable
              if (!queryData.item_id) {
                queryString = `SELECT want_item_id C_id, required_item_id A_id FROM want w JOIN items i ON w.required_item_id = i.id WHERE i.user_nickname = ? AND i.availability = "true"`
              } else if (queryData.item_id && queryData.user_nickname) {
                queryString = `SELECT want_item_id C_id, w.checked, i.* FROM want w JOIN items i ON w.required_item_id = i.id JOIN items i2 ON w.want_item_id = i2.id WHERE w.required_item_id = ? AND i2.user_nickname = ? AND i.availability = "true"`
                queryCondition = [queryData.item_id, queryData.user_nickname]
              } else {
                queryString = `SELECT want_item_id C_id, w.checked, i.* FROM want w JOIN items i ON w.required_item_id = i.id WHERE w.required_item_id = ? AND i.availability = "true"`
                queryCondition = [queryData.item_id]
              }
              // console.log('queryString')
              // console.log(queryString)
              // console.log('queryCondition');
              // console.log(queryCondition);
              // console.log(queryCondition);
              mysql.pool.query(queryString, queryCondition, (err, CwantAtable, fileds) => {
                // console.log(CwantAtable);
                if (err) {
                  console.log('error in CwantAtablePromise');
                  console.log(err.sqlMessage);
                  console.log(err.sql);
                  reject(err);
                } else {
                  // console.log('CwantAtable.length === 0')
                  // console.log(CwantAtable.length === 0)
                  if (CwantAtable.length === 0) {
                    resolve({
                      doubleMatchResultArr: doubleMatchResultArr,
                      tripleMatchResultArr: tripleMatchResultArr,
                    })
                  } else {
                    // console.log('CwantAtable')
                    // console.log(CwantAtable)
                    // let doubleMatchResultArr = [];
                    let CwantAwantBtable = [];
                    if (!queryData.item_id) {
                      for (let i = 0; i < CwantAtable.length; i++) {
                        for (let j = 0; j < AwantBtable.length; j++) {
                          if (CwantAtable[i].A_id === AwantBtable[j].A_id && CwantAtable[i].C_id === AwantBtable[j].B_id) {
                            doubleMatchResultArr.push(AwantBtable[j])
                            break;
                          }
                        }
                      }
                      // 3. 用 1 + 2 取得 CwantAwantBtable
                      for (let i = 0; i < CwantAtable.length; i++) {
                        for (let j = 0; j < AwantBtable.length; j++) {
                          if (CwantAtable[i].A_id === AwantBtable[j].A_id) {
                            CwantAwantBtable.push({
                              A_id: CwantAtable[i].A_id,
                              B_id: AwantBtable[j].B_id,
                              C_id: CwantAtable[i].C_id,
                              title: AwantBtable[j].title,
                            })
                          }
                        }
                      }
                      // console.log('CwantAwantBtable');
                      // console.log(CwantAwantBtable);
                    }
                    // 用 AwantB, CwantA 取得 BwantC
                    queryString = `SELECT want_item_id B_id, required_item_id C_id, w.checked, i.* FROM want w JOIN items i ON i.id = w.required_item_id WHERE w.want_item_id IN (?) AND w.required_item_id IN (?) AND i.availability = "true"`
                    queryCondition = [];
                    B_idArr = [];
                    C_idArr = [];
                    AwantBtable.forEach(AwantB => { B_idArr.push(AwantB.B_id) })
                    CwantAtable.forEach(CwantA => { C_idArr.push(CwantA.C_id) })
                    queryCondition.push(B_idArr);
                    queryCondition.push(C_idArr);
                    if (queryData.item_id) {
                      // 如果某 id 同時存在於 B,C 兩個 Array, 代表 doubleMatch
                      tempArr = AwantBtable.filter(AwantB => C_idArr.indexOf(AwantB.B_id) !== -1)
                      tempArr.forEach(AwantB => {
                        doubleMatchResultArr.push({
                          C_item: AwantB, // check in B_item = AwantB check
                          A_item: CwantAtable.filter(e => e.C_id === AwantB.B_id)[0], // check in A_item = BwantA check
                          C_id: AwantB.B_id,
                          A_id: queryData.item_id,
                        })
                      })
                    }
                    // console.log(queryCondition);
                    // console.log('queryString')
                    // console.log(queryString)
                    // console.log('queryCondition');
                    // console.log(queryCondition);
                    mysql.pool.query(queryString, queryCondition, (err, BwantCtable, fileds) => {
                      // console.log(BwantCtable);
                      if (err) {
                        console.log('error in BwantCtablePromise');
                        console.log(err.sqlMessage);
                        console.log(err.sql);
                        reject(err);
                      } else {
                        // console.log('BwantCtable')
                        // console.log(BwantCtable)
                        // let tripleMatchResultArr = [];
                        if (!queryData.item_id) {
                          for (let i = 0; i < CwantAwantBtable.length; i++) {
                            for (let j = 0; j < BwantCtable.length; j++) {
                              if (CwantAwantBtable[i].C_id === BwantCtable[j].C_id && CwantAwantBtable[i].B_id === BwantCtable[j].B_id) {
                                tripleMatchResultArr.push(CwantAwantBtable[i])
                                break;
                              }
                            }
                          }
                        } else {
                          BwantCtable.forEach(BwantC => {
                            tripleMatchResultArr.push({
                              C_item: BwantC,
                              A_item: CwantAtable.filter(CwantA => CwantA.C_id === BwantC.C_id)[0],
                              B_item: AwantBtable.filter(AwantB => AwantB.B_id === BwantC.B_id)[0],
                              C_id: BwantC.C_id,
                              A_id: queryData.item_id,
                              B_id: BwantC.B_id,
                            })
                          })
                        }
                        // console.log(tripleMatchResultArr);
                        resolve({
                          doubleMatchResultArr: doubleMatchResultArr,
                          tripleMatchResultArr: tripleMatchResultArr,
                        })
                      }
                    })
                  }
                }
              })
            }
          }

        })
      })
    } else {
      // console.log('search item wish list in wantDAO by item_id');
      queryString = `SELECT * FROM want JOIN items i ON i.id = want.required_item_id WHERE want_item_id = ? AND i.availability = "true"`;
      queryCondition = [queryData.item_id];
      return new Promise((resolve, reject) => {
        mysql.pool.query(queryString, queryCondition, (err, checkPreviousWantResult, fileds) => {
          // console.log(checkPreviousWantResult);
          if (err) {
            console.log('error in checkPreviousWantPromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          } else {
            resolve(checkPreviousWantResult);
          }
        })
      })
    }
  },
  update: (queryData) => {
    // 更新 want/checked column
    // console.log('queryData');
    // console.log(queryData);
    return new Promise((resolve, reject) => {
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



/**

// -- O(n^2) loop 產生 CwantAwantB
let CwantAwantBtable = [];
for (let i = 0; i < CwantAtable.length; i++) {
  for (let j = 0; j < AwantBtable.length; j++) {
    if (CwantAtable[i].A_id === AwantBtable[j].A_id) {
      CwantAwantBtable.push({
        A_id: CwantAwantBtable.A_id,
        B_id: AwantBtable.B_id,
        C_id: CwantAwantBtable.C_id,
      })
    }
  }
}

let tripleMatchResultArr = [];
BwantCtable.forEach(BwantC => {

})
for (let i = 0; i < CwantAwantBtable.length; i++) {
  for (let j = 0; j < BwantCtable.length; j++) {
    if (CwantAwantBtable[i].C_id === BwantCtable.C_id && CwantAwantBtable[i].B_id === BwantCtable.B_id) {
      tripleMatchResultArr.push(CwantAwantBtable[i])
      break;
    }
  }
}

// 取得 CwantAtalbe
queryString = `SELECT want_item_id C_id, required_item_id A_id FROM want w JOIN items i ON w.required_item_id = i.id WHERE i.user_nickname = ?`
queryCondition = queryData.user_nickname
console.log(queryCondition);
mysql.pool.query(queryString, [queryCondition], (err, CwantAtable, fileds) => {

})

*/