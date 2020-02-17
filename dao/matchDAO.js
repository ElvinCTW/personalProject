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
    })
  },
  get: (queryCondition) => {
    if (queryCondition.user_nickname) {
    } else if (queryCondition.action === 'getConfirmedMatchItemsId') {
      // 用 matched_ID 得到 match data
      return new Promise((resolve, reject)=>{
        let queryString;
        queryString = 'SELECT start_item_id, middle_item_id, end_item_id FROM matched WHERE matched.id = ?';
        mysql.pool.query(queryString, queryCondition.matched_id, (err, getConfirmedMatchItemsDataResult, fileds) => {
          if (err) {
            mysql.errLog(err,'getConfirmedMatchItemsDataResult','itemDAO')
            reject(err)
          } else {
            // console.log('getConfirmedMatchItemsDataResult[0]')
            // console.log(getConfirmedMatchItemsDataResult[0])
            if (typeof getConfirmedMatchItemsDataResult[0].middle_item_id !== 'number') {
              resolve({
                start_item_id: getConfirmedMatchItemsDataResult[0].start_item_id,
                end_item_id: getConfirmedMatchItemsDataResult[0].end_item_id,
              })
            } else {
              resolve(getConfirmedMatchItemsDataResult[0])
            }
          }
        });
      })
    } else {
    }
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
        updateQueryCondition = [queryCondition.want_item_id,queryCondition.required_item_id];
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