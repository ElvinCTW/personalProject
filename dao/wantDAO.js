const mysql = require('../util/mysql');

module.exports = {
  insert: (wantData) => {
    return new Promise((resolve, reject) => {
      let insertWantsArr = [];
      // make insert rows base on wantItemID
      // wantData.wantArr = wantData.wantArr.split(',');
      wantData.wantArr.forEach(wantItemID => {
        // make want row
        let wantItemIDInt = parseInt(wantItemID)
        let requiredInt = parseInt(wantData.required)
        let wantRow = [wantItemIDInt, wantData.want_owner, requiredInt, wantData.required_owner];
        // push in arr
        insertWantsArr.push(wantRow)
        if (wantData.matchedArr.indexOf(parseInt(wantItemID)) !== -1) {
          wantRow.push('true');
        } else {
          wantRow.push('false');
        }
      });
      mysql.pool.query('INSERT INTO want(want_item_id, want_owner, required_item_id, required_owner, matched) VALUES ?', [insertWantsArr], (err, insertWantResult, fields) => {
        if (err) {
          console.log('error in insertWantPromise');
          console.log(err.sqlMessage);
          console.log(err.sql);
          reject(err);
        } else {
          // if success, send back success msg
          resolve({
            msg: `insert success, total ${insertWantResult.affectedRows} rows added`,
          });
          console.log('insert item success');
        }
      })
    });
  },
  get: (queryCondition) => {
    // settings
    let parseIntArr = [];
    let queryString = '';
    let getQueryCondition;
    queryCondition.item_id = parseInt(queryCondition.item_id);
    if (queryCondition.endItemsArr) {
      // 三方配對時，用 end_item 作為 want_item 搜尋 WishList，結果數字代表三方配對完成方式數量
      console.log('search wish list of end_items in wantDAO');
      queryCondition.wantArr.forEach((item_id) => {
        parseIntArr.push(parseInt(item_id));
      })
      queryString = `SELECT * FROM want WHERE want_item_id in (?) AND required_item_id in (?)`;
      getQueryCondition = [queryCondition.endItemsArr, parseIntArr];
    } else if (queryCondition.wantArr) {
      console.log('search required_item want want_items or not in wantDAO');
      // 查詢指定物品有無針對特定物品群表示過 want
      queryCondition.wantArr.forEach((item_id) => {
        parseIntArr.push(parseInt(item_id));
      })
      queryString = `SELECT * FROM want WHERE want_item_id = ? AND required_item_id in (?)`;
      getQueryCondition = [queryCondition.item_id, parseIntArr];
    } else {
      console.log('search item wish list in wantDAO');
      queryString = `SELECT * FROM want WHERE want_item_id = ?`;
      getQueryCondition = [queryCondition.item_id];
    }
    // 有 user 申請交換請求時，確認對方有無對自己的商品提出過交換請求
    return new Promise((resolve, reject) => {
      mysql.pool.query(queryString, getQueryCondition, (err, checkPreviousWantResult, fileds) => {
        console.log(checkPreviousWantResult);
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
  },
  update: (queryCondition) => {
    // 更新 matched column
    return new Promise((resolve, reject) => {
      mysql.pool.query(`UPDATE want SET matched = 'true' WHERE want_item_id = ? AND required_item_id in (?)`, [queryCondition.item_id, queryCondition.matchedArr], (err, updateMatchResult, fileds) => {
        if (err) {
          reject(err);
        } else {
          resolve(updateMatchResult);
        }
      })
    })
  }
}