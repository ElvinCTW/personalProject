const mysql = require('../util/mysql');

module.exports = {
  insert: (matchData) => {
    return new Promise((resolve, reject) => {
      let insertMatchedArr = [];
      matchData.bridgeWantArr.forEach((bridgeWantFromEndToStart) => {
        let start_item_id = bridgeWantFromEndToStart.required_item_id;
        let start_owner = bridgeWantFromEndToStart.required_owner;
        let middle_item_id = matchData.middle_item_id;
        let middle_owner = matchData.middle_owner;
        let end_item_id = bridgeWantFromEndToStart.want_item_id;
        let end_owner = bridgeWantFromEndToStart.want_owner;
        let insertedMatchRow = [start_item_id, start_owner, middle_item_id, middle_owner, end_item_id, end_owner]
        insertMatchedArr.push(insertedMatchRow);
      })
      let queryString = 'INSERT INTO matched (start_item_id, start_owner, middle_item_id, middle_owner, end_item_id, end_owner) VALUES ?'
      mysql.pool.query(queryString, [insertMatchedArr], (err, insertMatchResult, fields) => {
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
  },
  get: (queryCondition) => {
    if (queryCondition.user_nickname) {
      // 查詢該會員的所有交易資料
      console.log('search match result of user in wantDAO');
      queryString = `SELECT w.want_item_id AS item_id, i.title FROM want AS w JOIN items AS i ON w.want_item_id = i.id WHERE w.want_owner = ? AND w.matched = "true"`
      const placeArr =['start', 'middle', 'end'];
      placeArr.forEach((place)=>{
        queryString += ` UNION SELECT m.${place}_item_id AS item_id, i.title FROM matched AS m JOIN items AS i ON m.${place}_item_id = i.id WHERE m.${place}_owner = "${queryCondition.user_nickname}"`
      })
      getQueryCondition = [queryCondition.user_nickname];
      // 之後還要做 required_item list side bar
    } else {
      // 根據物品 ID 查詢該物品的配對結果和詳細物品資料
      queryCondition.item_id = parseInt(queryCondition.item_id)
      const placeArr = ['start', 'middle', 'end'];
      if (queryCondition.item_type === 'want') {
        console.log('search match result of item as want_item in matchDAO');
        queryString = `SELECT w.matched, i.* FROM want AS w JOIN items AS i ON w.required_item_id = i.id WHERE w.want_item_id = ? AND w.matched = "true"`
        for (index in placeArr) {
          let want_place = placeArr[index % 3];
          let required_place = placeArr[(index + 1) % 3];
          queryString += ` UNION SELECT null AS matched, i.* FROM matched AS m JOIN items AS i ON m.${required_place}_item_id = i.id WHERE m.${want_place}_item_id = ${queryCondition.item_id}`
        }
        getQueryCondition = [queryCondition.item_id];
      } else {
        console.log('search match result of item as reuired_item in matchDAO');
      }
    }
    return new Promise((resolve, reject) => {
      // get matches array for user matches page 
      mysql.pool.query(queryString, getQueryCondition, (err, checkMatchResultArr, fileds) => {
        console.log(checkMatchResultArr);
        if (err) {
          console.log('error in checkMatchResultPromise');
          console.log(err.sqlMessage);
          console.log(err.sql);
          reject(err);
        } else {
          resolve(checkMatchResultArr);
        }
      })
    });
  },
}