const mysql = require('../util/mysql');

module.exports = {
  insertMatchRecord,
  getConfirmedMatchItemsId,
}

function getConfirmedMatchItemsId(matched_id) {
  return new Promise((resolve, reject) => {
    let queryString =
      `SELECT start_item_id, 
    middle_item_id, 
    end_item_id 
    FROM matched 
    WHERE matched.id = ?`;
    mysql.advancedQuery({
      queryString: queryString,
      queryCondition: [matched_id],
      queryName: 'confirmedMatchItemsData',
      DAO_name: 'matchDAO',
      reject: reject,
    }, (confirmedMatchItemsData) => {
      // resolve(confirmedMatchItemsData)
      if (typeof confirmedMatchItemsData[0].middle_item_id !== 'number') {
        resolve({
          start_item_id: confirmedMatchItemsData[0].start_item_id,
          end_item_id: confirmedMatchItemsData[0].end_item_id,
        })
      } else {
        resolve(confirmedMatchItemsData[0])
      }
    })
  })
}

function insertMatchRecord(id_Arr) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    if (id_Arr) {
      if (id_Arr.length === 3) {
        queryString = 'INSERT INTO matched(start_item_id, middle_item_id, end_item_id) VALUES(?)';
      } else if (id_Arr.length === 2) {
        queryString = 'INSERT INTO matched(start_item_id, end_item_id) VALUES(?)';
      }
      mysql.pool.query(queryString, [id_Arr], (err, insertMatchTableResult, fileds) => {
        if (err) {
          mysql.errLog(err, 'insertMatchTableResult', 'matchDAO')
          reject(err)
        } else {
          resolve(insertMatchTableResult.insertId);
        }
      });
    }
  })
}