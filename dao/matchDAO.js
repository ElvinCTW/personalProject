const mysql = require('../util/mysql');
const placeArr = ['start', 'middle', 'end'];

module.exports = {
  insert: (matchData) => {
    return new Promise((resolve, reject) => {
      let queryString = '';
      if (matchData.id_Arr) {
        if (matchData.id_Arr.length === 3 ) {
          queryString = 'INSERT INTO matched(start_item_id, middle_item_id, end_item_id) VALUES(?)';
        } else if (matchData.id_Arr.length === 2) {
          queryString = 'INSERT INTO matched(start_item_id, end_item_id) VALUES(?)';
        }
        mysql.pool.query(queryString, [matchData.id_Arr], (err, insertMatchTableResult, fileds) => {
          if (err) {
            mysql.errLog(err,'insertMatchTableResult','matchDAO')
            reject(err)
          } else {
            console.log('insertMatchTableResult')
            console.log(insertMatchTableResult)
            console.log('insertMatchTableResult.insertId')
            console.log(insertMatchTableResult.insertId)
            resolve(insertMatchTableResult.insertId);
          }
        });
      }
      // let insertMatchedArr = [];
      // matchData.bridgeWantArr.forEach((bridgeWantFromEndToStart) => {
      //   let insertedMatchRow =
      //     [bridgeWantFromEndToStart.required_item_id,
      //     bridgeWantFromEndToStart.required_owner,
      //     matchData.middle_item_id,
      //     matchData.middle_owner,
      //     bridgeWantFromEndToStart.want_item_id,
      //     bridgeWantFromEndToStart.want_owner]
      //   insertMatchedArr.push(insertedMatchRow);
      // })
      // let queryString = 'INSERT INTO matched (start_item_id, start_owner, middle_item_id, middle_owner, end_item_id, end_owner) VALUES ?'
      // mysql.pool.query(queryString, [insertMatchedArr], (err, insertMatchResult, fields) => {
      //   if (err) {
      //     console.log('error in insertMatchedRowPromise');
      //     console.log(err.sqlMessage);
      //     console.log(err.sql);
      //     reject(err);
      //   } else {
      //     resolve(insertMatchResult);
      //   }
      // })
    })
  },
  get: (queryCondition) => {
    if (queryCondition.user_nickname) {
      // // 查詢該會員的所有交易資料
      // console.log('search match result of user in wantDAO');
      // queryString = `SELECT w.want_item_id AS item_id, i.title FROM want AS w JOIN items AS i ON w.want_item_id = i.id WHERE w.want_owner = ? AND w.matched = "true"`
      // placeArr.forEach((place) => {
      //   queryString += ` UNION SELECT m.${place}_item_id AS item_id, i.title FROM matched AS m JOIN items AS i ON m.${place}_item_id = i.id WHERE m.${place}_owner = "${queryCondition.user_nickname}"`
      // })
      // getQueryCondition = [queryCondition.user_nickname];
      // 之後還要做 required_item list side bar
    } else if (queryCondition.matched_id && queryCondition.userIndex) {
      // 用 matched_ID 得到 match data

    } else {
      // 根據物品 ID 查詢該物品的配對結果和詳細物品資料
      queryCondition.item_id = parseInt(queryCondition.item_id)
      if (queryCondition.item_type === 'want') {
        console.log('search match result of item as want_item in matchDAO');
        queryString = `SELECT w.matched, w.want_owner, w.required_owner, w.want_owner_check, w.required_owner_check, null AS triple_id,null AS start_owner, null AS middle_owner, null AS end_owner, null AS start_owner_check, null AS middle_owner_check, null AS end_owner_check, i.* FROM want AS w JOIN items AS i ON w.required_item_id = i.id WHERE w.want_item_id = ? AND w.matched = "true"`
        for (index in placeArr) {
          let want_place = placeArr[index % 3];
          let required_place = placeArr[(index + 1) % 3];
          queryString += ` UNION SELECT null AS matched, null, null, null, null, m.id AS triple_id ,start_owner, middle_owner, end_owner, start_owner_check, middle_owner_check, end_owner_check, i.* FROM matched AS m JOIN items AS i ON m.${required_place}_item_id = i.id WHERE m.${want_place}_item_id = ${queryCondition.item_id}`
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
  update: (queryCondition) => {
    return new Promise((resolve, reject) => {
      console.log('matchDAO.update queryCondition is :');
      console.log(queryCondition);
      let queryString;
      let updateQueryCondition;
      if (queryCondition.want_item_id && queryCondition.required_item_id) {
        // double
        queryCondition.want_item_id = parseInt(queryCondition.want_item_id);
        queryCondition.required_item_id = parseInt(queryCondition.required_item_id);
        updateQueryCondition =
          [
            queryCondition.want_item_id,
            queryCondition.required_item_id,
            // queryCondition.required_item_id,
            // queryCondition.want_item_id,
            // [queryCondition.want_item_id, queryCondition.required_item_id],
            // [queryCondition.want_item_id, queryCondition.required_item_id],
          ];
        // make 2 query first
        queryString = `UPDATE want SET want_owner_check = "${queryCondition.type}" WHERE want_item_id = ? AND required_item_id = ? AND matched = "true"`
        mysql.pool.query(queryString, updateQueryCondition, (err, updateCheckStatusResult, fields) => {
          console.log('first update query');
          console.log(updateCheckStatusResult);
          if (err) {
            console.log('error in updateCheckStatusResultPromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          } else {
            queryString = `UPDATE want SET required_owner_check = "${queryCondition.type}" WHERE required_item_id = ? AND want_item_id = ? AND matched = "true"`
            mysql.pool.query(queryString, updateQueryCondition, (err, updateCheckStatusResult, fields) => {
              console.log('second update query');
              console.log(updateCheckStatusResult);
              if (err) {
                console.log('error in updateCheckStatusResultPromise');
                console.log(err.sqlMessage);
                console.log(err.sql);
                reject(err);
              } else {
                // get data from want to check double confirm, if so, alert both user and un-available both items
                queryString = `SELECT * from want WHERE want_item_id in (?) AND required_item_id in (?) AND matched = "true" AND want_owner_check = "confirm" AND required_owner_check = "confirm"`
                updateQueryCondition = [[queryCondition.want_item_id, queryCondition.required_item_id], [queryCondition.want_item_id, queryCondition.required_item_id]]
                console.log('matchDAO.update updateQueryCondition is :');
                console.log(updateQueryCondition);
                mysql.pool.query(queryString, updateQueryCondition, (err, checkAllConfirmResultArr, fields) => {
                  console.log('select check all confirm query');
                  console.log(checkAllConfirmResultArr);
                  if (err) {
                    console.log('error in checkAllConfirmResultPromise');
                    console.log(err.sqlMessage);
                    console.log(err.sql);
                    reject(err);
                  } else {
                    // if a match with all confirm were found, checkAllConfirmResultArr.length > 0
                    
                    resolve(checkAllConfirmResultArr);
                  }
                })
              }
            })
          }
        })
      } else {
        //  triple
        queryString = `UPDATE matched SET ${placeArr[queryCondition.userIndex]}_owner_check = "${queryCondition.type}" WHERE matched.id = ?;`
        updateQueryCondition = [queryCondition.matched_id]
        mysql.pool.query(queryString, updateQueryCondition, (err, updateCheckStatusResult, fields) => {
          console.log(updateCheckStatusResult);
          if (err) {
            console.log('error in updateCheckStatusResultPromise');
            console.log(err.sqlMessage);
            console.log(err.sql);
            reject(err);
          }
          queryString = `SELECT * from matched WHERE matched.id = ? AND start_owner_check = "confirm" AND middle_owner_check = "confirm" AND end_owner_check = "confirm"`
          console.log('matchDAO.update updateQueryCondition is :');
          console.log(updateQueryCondition);
          mysql.pool.query(queryString, updateQueryCondition, (err, checkAllConfirmResultArr, fields) => {
            console.log('select check all confirm query');
            console.log(checkAllConfirmResultArr);
            if (err) {
              console.log('error in checkAllConfirmResultPromise');
              console.log(err.sqlMessage);
              console.log(err.sql);
              reject(err);
            } else {
              // if a match with all confirm were found, checkAllConfirmResultArr.length > 0
              
              resolve(checkAllConfirmResultArr);
            }
          })
        })
      }
    })
  },
}