const mysql = require('../util/mysql');

module.exports = {
  insert: (matchData)=>{
    return new Promise((resolve,reject)=>{
      let insertMatchedArr=[];
      matchData.bridgeWantArr.forEach((bridgeWantFromEndToStart)=>{
        let start_item_id = bridgeWantFromEndToStart.required_item_id;
        let start_owner = bridgeWantFromEndToStart.required_owner;
        let middle_item_id = matchData.middle_item_id;
        let middle_owner = matchData.middle_owner;
        let end_item_id = bridgeWantFromEndToStart.want_item_id;
        let end_owner = bridgeWantFromEndToStart.want_owner;
        let insertedMatchRow = [start_item_id,start_owner,middle_item_id,middle_owner,end_item_id,end_owner]
        insertMatchedArr.push(insertedMatchRow);
      })
      let queryString = 'INSERT INTO matched (start_item_id, start_owner, middle_item_id, middle_owner, end_item_id, end_owner) VALUES ?'
      mysql.pool.query(queryString, [insertMatchedArr], (err, insertMatchResult, fields)=>{
        if (err) {
          console.log('error in insertMatchedRowPromise');
          console.log(err.sqlMessage);
          console.log(err.sql);
          reject(err);
        } else {
          resolve(insertMatchResult);
        }
      })
    })
  }
}