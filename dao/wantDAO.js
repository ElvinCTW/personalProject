const mysql = require('../util/mysql');

module.exports = {
  insert: (queryData) => {
    return new Promise((resolve, reject) => {
      let insertWantsArr = [];
      // make insert rows base on wantItemID
      // queryData.wantArr = queryData.wantArr.split(',');
      queryData.wantArr.forEach(wantItemID => {
        // make want row
        // let wantItemIDInt = parseInt(wantItemID)
        // let requiredItemInt = parseInt(queryData.required_item_id)
        let wantRow = [parseInt(wantItemID), parseInt(queryData.required_item_id)];
        // push in arr
        insertWantsArr.push(wantRow)
        // if (queryData.matchedArr.indexOf(parseInt(wantItemID)) !== -1) {
        //   wantRow.push('true');
        // } else {
        //   wantRow.push('false');
        // }
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
          console.log('insert item success');
        }
      })
    });
  },
  get: (queryData) => {
    // settings
    let parseIntArr = [];
    let queryString = '';
    let queryCondition;
    queryData.item_id = parseInt(queryData.item_id);
    if (queryData.endItemsArr) {
      // 三方配對時，用 end_item 作為 want_item 搜尋 WishList，結果數字代表三方配對完成方式數量
      // console.log('search wish list of end_items in wantDAO');
      // queryData.wantArr.forEach((item_id) => {
      //   parseIntArr.push(parseInt(item_id));
      // })
      // queryString = `SELECT * FROM want WHERE want_item_id in (?) AND required_item_id in (?)`;
      // queryCondition = [queryData.endItemsArr, parseIntArr];
    } else if (queryData.wantArr) {
      console.log('search required_item want want_items or not in wantDAO');
      // 查詢 required_item 有無針對 offer_items 表示過 want (item_detail 新增 want 用)
      queryData.wantArr.forEach((item_id) => {
        parseIntArr.push(parseInt(item_id));
      })
      queryString = `SELECT * FROM want WHERE want_item_id = ? AND required_item_id in (?)`;
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
            queryString = `SELECT * FROM want WHERE want_item_id IN ( SELECT required_item_id FROM want WHERE want_item_id = ? ) AND required_item_id in (?)`;
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
      // queryString = `SELECT w.want_item_id AS item_id, i.title FROM want AS w JOIN items AS i ON w.want_item_id = i.id WHERE w.want_owner = ? AND w.matched = "true"`
      // placeArr.forEach((place) => {
      //   queryString += ` UNION SELECT m.${place}_item_id AS item_id, i.title FROM matched AS m JOIN items AS i ON m.${place}_item_id = i.id WHERE m.${place}_owner = "${queryData.user_nickname}"`
      // })
      // queryCondition = [queryData.user_nickname];

      /**
       * user_nickname query : A 是當前 user 資料，B 是 user 想要的資料， C 是想要 user 東西的資料
       * item_id query : A 是 user 想要的東西資料，B 是想要 user 東西的資料， C 是 user 的東西
       * => 以 query 條件的進入點為 A
       */
      // 查詢該會員的所有交易資料
      // 1. 用 user_nickname 取得 AwantB
      return new Promise((resolve, reject) => {
        if (!queryData.item_id) {
          console.log('search match result of user in wantDAO');
          queryString = `SELECT want_item_id A_id, required_item_id B_id, i.title FROM want w JOIN items i ON w.want_item_id = i.id WHERE i.user_nickname = ?`
          queryCondition = [queryData.user_nickname]
        } else {
          console.log('search match result of item_id in wantDAO');
          queryString = `SELECT w.required_item_id B_id, w.checked, i.* FROM want w JOIN items i ON w.required_item_id = i.id WHERE w.want_item_id = ?`
          queryCondition = [queryData.item_id]
        }
        // console.log(queryData);
        // console.log(queryCondition);
        mysql.pool.query(queryString, queryCondition, (err, AwantBtable, fileds) => {
          // console.log(AwantBtable);
          if (err) {
            console.log('error in AwantBtablePromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          } else {
            // 2. 用 user_nickname 取得 CwantA , 並取得 DoubleMatchTable
            if (!queryData.item_id) {
              queryString = `SELECT want_item_id C_id, required_item_id A_id FROM want w JOIN items i ON w.required_item_id = i.id WHERE i.user_nickname = ?`
            } else {
              queryString = `SELECT want_item_id C_id, w.checked, i.* FROM want w JOIN items i ON w.required_item_id = i.id JOIN items i2 ON w.want_item_id = i2.id WHERE w.required_item_id = ? AND i2.user_nickname = ?`
              queryCondition = [queryData.item_id, queryData.user_nickname]
            }
            // console.log(queryCondition);
            mysql.pool.query(queryString, queryCondition, (err, CwantAtable, fileds) => {
              // console.log(CwantAtable);
              if (err) {
                console.log('error in CwantAtablePromise');
                console.log(err.sqlMessage);
                console.log(err.sql);
                reject(err);
              } else {
                let doubleMatchResultArr = [];
                let CwantAwantBtable = [];
                if (!queryData.item_id) {
                  for (let i = 0; i < CwantAtable.length; i++) {
                    for (let j = 0; j < AwantBtable.length; j++) {
                      if (CwantAtable[i].A_id === AwantBtable[j].A_id && CwantAtable[i].C_id === AwantBtable[j].B_id) {
                        doubleMatchResultArr.push(AwantBtable[j])
                        break;
                      }
                      // if ( queryData.item_id && CwantAtable[i].C_id === AwantBtable[j].B_id) {
                      //   doubleMatchResultArr.push(AwantBtable[j])
                      // }
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
                queryString = `SELECT want_item_id B_id, required_item_id C_id, w.checked, i.* FROM want w JOIN items i ON i.id = w.required_item_id WHERE w.want_item_id IN (?) AND w.required_item_id IN (?)`
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
                      A_item: CwantAtable.filter(e=>e.C_id === AwantB.B_id)[0], // check in A_item = BwantA check
                      C_id: AwantB.B_id,
                      A_id: queryData.item_id,
                      // A_check: AwantB.checked,
                      // B_check: AwantB.checked,
                    })
                  })
                }
                // console.log(queryCondition);
                mysql.pool.query(queryString, queryCondition, (err, BwantCtable, fileds) => {
                  // console.log(BwantCtable);
                  if (err) {
                    console.log('error in BwantCtablePromise');
                    console.log(err.sqlMessage);
                    console.log(err.sql);
                    reject(err);
                  } else {
                    let tripleMatchResultArr = [];
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
                        // BwantC.A_id = queryData.item_id
                        // // BwantC.A_item
                        // BwantC.A_item = CwantAtable.filter(CwantA => CwantA.C_id === BwantC.C_id)[0]
                        // BwantC.B_item = AwantBtable.filter(AwantB => AwantB.B_id === BwantC.B_id)[0]
                        // change
                        // BwantC.C_item = CwantAtable.filter(CwantA => CwantA.C_id === BwantC.C_id)[0]
                        tripleMatchResultArr.push({
                          C_item: BwantC,
                          A_item: CwantAtable.filter(CwantA => CwantA.C_id === BwantC.C_id)[0],
                          B_item: AwantBtable.filter(AwantB => AwantB.B_id === BwantC.B_id)[0],
                          C_id: BwantC.C_id,
                          A_id: queryData.item_id,
                          B_id: BwantC.B_id,
                        })
                      })
                      // tripleMatchResultArr = BwantCtable
                    }
                    // console.log(tripleMatchResultArr);
                    resolve({
                      doubleMatchResultArr: doubleMatchResultArr,
                      tripleMatchResultArr: tripleMatchResultArr,
                    })
                  }
                })
              }
            })
          }
          // } else {
          //   // resolve(checkPreviousWantResult);
          //   // 取的 BwantC
          //   queryCondition = [];
          //   AwantBtable.forEach(AwantB => {
          //     queryCondition.push(AwantB.B_id);
          //   })
          //   console.log(queryCondition);
          //   queryString = `SELECT w.required_item_id C_id, w.want_item_id B_id, i.title FROM want w JOIN items i ON w.want_item_id = i.id WHERE want_item_id in (?)`
          //   mysql.pool.query(queryString, [queryCondition], (err, BwantCtable, fileds) => {
          //     console.log(BwantCtable);
          //     if (err) {
          //       console.log('error in BwantCtablePromise');
          //       console.log(err.sqlMessage);
          //       console.log(err.sql);
          //       reject(err);
          //     } else {
          //       // queryCondition.length = 0;
          //       // BwantCtable.forEach(BwantC =>{
          //       //   queryCondition.push(BwantC.required_item_id);
          //       // })
          //       // queryString = `SELECT want_item_id B_id, required_item_id C_id FROM want WHERE want_item_id in (?)`
          //       const AmatchBArr = [];
          //       for (let i = 0; i < AwantBtable.length; i++) {
          //         for (let j = 0; j < BwantCtable.length; j++) {
          //           if (AwantBtable[i].A_id === BwantCtable[j].C_id && AwantBtable[i].B_id === BwantCtable[j].B_id) {
          //             AmatchBArr.push(BwantCtable[j]);
          //             break;
          //           }
          //         }
          //       }
          //       console.log(AmatchBArr);
          //       // resolve(AmatchBArr);
          //       queryString = `SELECT w.required_item_id D_id, w.want_item_id C_id, i.title FROM want w JOIN items i ON w.want_item_id = i.id WHERE want_item_id in (?)`
          //       queryCondition.length = 0;
          //       BwantCtable.forEach(BwantC => {
          //         queryCondition.push(BwantC.C_id);
          //       })
          //       mysql.pool.query(queryString, [queryCondition], (err, CwantDtable, fileds) => {
          //         console.log(CwantDtable);
          //         if (err) {
          //           console.log('error in CwantDtablePromise');
          //           console.log(err.sqlMessage);
          //           console.log(err.sql);
          //           reject(err);
          //         } else {
          //           const AmatchCArr = [];
          //           for (let i = 0; i < AwantBtable.length; i++) {
          //             for (let j = 0; j < BwantCtable.length; j++) {
          //               if (AwantBtable[i].A_id === BwantCtable[j].C_id && AwantBtable[i].B_id === BwantCtable[j].B_id) {
          //                 AmatchBArr.push(BwantCtable[j]);
          //               }
          //             }
          //           }
          //         }
          //       })
          //     }
          //   })
          // }
        })
      })
    } else {
      console.log('search item wish list in wantDAO by item_id');
      queryString = `SELECT * FROM want WHERE want_item_id = ?`;
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
    // 有 user 申請交換請求時，確認對方有無對自己的商品提出過交換請求
    // return new Promise((resolve, reject) => {
    //   mysql.pool.query(queryString, queryCondition, (err, checkPreviousWantResult, fileds) => {
    //     console.log(checkPreviousWantResult);
    //     if (err) {
    //       console.log('error in checkPreviousWantPromise');
    //       console.log(err.sqlMessage);
    //       console.log(err.sql);
    //       reject(err);
    //     } else {
    //       resolve(checkPreviousWantResult);
    //     }
    //   })
    // }) 
  },
  update: (queryData) => {
    // 更新 want/checked column
    return new Promise((resolve, reject) => {
      let queryString = `UPDATE want SET checked = ? WHERE want_item_id = ? AND required_item_id = ?`;
      let queryCondition = [queryData.type, queryData.want_item_id, queryData.required_item_id]
      mysql.pool.query(queryString, queryCondition, (err, updateCheckedResult, fileds) => {
        if (err) {
          mysql.errLog(err,'updateCheckedPromise','wantDAO')
          reject(err);
        } else {
          // resolve(updateMatchResult);
          /**
           * 檢查是否有成功的 confirmed 配對，若有查到則進行以下動作
           * 1.物品下架
           * 2.新增交換紀錄
           * 3.對影響用戶進行通知
           * 4.為成交用戶建立討論區
           */
          // 檢查 double 是否成功配對 :
          queryString = `SELECT w.required_item_id, w.want_item_id FROM want w WHERE w.want_item_id = ? AND w.required_item_id = ? AND w.checked = "confirm"`;
          queryCondition.length = 0
          queryCondition.push(queryData.required_item_id, queryData.want_item_id)
          mysql.pool.query(queryString, queryCondition, (err, doubleSelectMatchResult, fileds) => {
            if (err) {
              mysql.errLog(err,'doubleSelectMatchResult','wantDAO')
              reject(err);
            } else {
              console.log('doubleSelectMatchResult');
              console.log(doubleSelectMatchResult);
              if (doubleSelectMatchResult.length > 0){
                console.log('double confirmed match, update item availability');
              } else {
                // 檢查 Triple confirmed match
                queryString = `SELECT * FROM want WHERE ( want_item_id = ? AND checked = "confirm") OR (required_item_id = ? AND checked = "confirm")`;
                // queryCondition.length = 0
                // queryCondition.push(queryData.want_item_id, queryData.required_item_id)
                console.log(queryCondition);
                mysql.pool.query(queryString, queryCondition, (err, getConfirmedwantResult, fileds) => {
                  if (err) {
                    mysql.errLog(err,'getConfirmedwantResult','wantDAO')
                    reject(err);
                  } else {
                    console.log('getConfirmedwantResult');
                    console.log(getConfirmedwantResult);
                    wantC_Arr = [];
                    wantC_Arr2 = [];
                    getConfirmedwantResult.forEach(want=>{
                      console.log(want.want_item_id);
                      console.log(parseInt(queryData.required_item_id));
                      if (want.want_item_id === parseInt(queryData.required_item_id)) {
                        wantC_Arr.push(want.required_item_id);
                      } else {
                        wantC_Arr2.push(want.want_item_id);
                      }
                    })
                    console.log(wantC_Arr);
                    console.log(wantC_Arr2);
                    let itemC_idArr = wantC_Arr.filter(value => wantC_Arr2.includes(value))
                    console.log('itemC_idArr');
                    console.log(itemC_idArr);
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