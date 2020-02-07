const mysql = require('../util/mysql');

module.exports = {
  insert: (wantData)=>{
  return new Promise((resolve,reject)=>{
      let insertWantsArr=[];
      console.log(wantData.matchedArr); 
      // make insert rows base on wantItemID
      wantData.wantArr = wantData.wantArr.split(',');
      wantData.wantArr.forEach( wantItemID => {
        // make want row
        let wantItemIDInt = parseInt(wantItemID)
        let requiredInt = parseInt(wantData.required)
        let wantRow = [wantItemIDInt, wantData.want_owner, requiredInt, wantData.required_owner];
        // push in arr
        insertWantsArr.push(wantRow)
        console.log(wantItemID);
        console.log(wantData.matchedArr);
        console.log(wantData.matchedArr.indexOf(parseInt(wantItemID)));
        if (wantData.matchedArr.indexOf(parseInt(wantItemID)) !== -1) {
          wantRow.push('true');
        } else {
          wantRow.push('false');
        }
      });
      mysql.pool.query('INSERT INTO want(want_item_id, want_owner, required_item_id, required_owner, matched) VALUES ?', [insertWantsArr], (err, insertWantResult, fields)=>{
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
  get: (queryCondition)=>{
    // 
    if (queryCondition.wantArr) {
      // 有 user 申請交換請求時，確認對方有無對自己的商品提出過交換請求
      return new Promise((resolve,reject)=>{ 
        queryCondition.item_id = parseInt(queryCondition.item_id);
        let parseIntArr = [];
        queryCondition.wantArr.forEach((item_id)=>{
          parseIntArr.push(parseInt(item_id));
        })
        mysql.pool.query(`SELECT * FROM want WHERE want_item_id = ? AND required_item_id in (?)`, [queryCondition.item_id, parseIntArr], (err, checkPreviousWantResult, fileds)=>{
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
    } else {
      // only search item's wish list
    }
  },
  update: (queryCondition)=>{
    // 更新 matched column
    return new Promise((resolve,reject)=>{ 
      mysql.pool.query(`UPDATE want SET matched = 'true' WHERE want_item_id = ? AND required_item_id in (?)`, [queryCondition.item_id, queryCondition.matchedArr], (err, updateMatchResult, fileds)=>{
        if (err) {
          reject(err);
        } else {
          resolve(updateMatchResult);
        }
      })
    })
  }
}