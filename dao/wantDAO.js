const mysql = require('../util/mysql');

module.exports = {
  insert: (wantData) => {
    return new Promise((resolve, reject) => {
      let insertWantsArr = [];
      // make insert rows base on wantItemID
      wantData.wantArr = wantData.wantArr.split(',');
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
    // 判斷查詢類型
    if (queryCondition.endItemsArr) {
      // make 3people match query
      queryCondition.wantArr.forEach((item_id) => {
        parseIntArr.push(parseInt(item_id));
      })
      queryString = `SELECT * FROM want WHERE want_item_id in (?) AND required_item_id in (?)`;
      getQueryCondition = [queryCondition.endItemsArr, parseIntArr];
    } else if (queryCondition.wantArr) {
      // 查詢指定物品有無針對特定物品群表示過 want
      queryCondition.wantArr.forEach((item_id) => {
        parseIntArr.push(parseInt(item_id));
      })
      queryString = `SELECT * FROM want WHERE want_item_id = ? AND required_item_id in (?)`;
      getQueryCondition = [queryCondition.item_id, parseIntArr];
    } else {
      console.log('in general want search');
      // 單純查詢某物品的願望清單
      queryString = `SELECT * FROM want WHERE want_item_id = ?`
      getQueryCondition = [queryCondition.item_id];
    }
    // 有 user 申請交換請求時，確認對方有無對自己的商品提出過交換請求
    return new Promise((resolve, reject) => {
      mysql.pool.query(queryString, getQueryCondition, (err, checkPreviousWantResult, fileds) => {
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