/* eslint-disable require-jsdoc */
const mysql = require('../util/mysql');

function getConfirmedMatchItemsId(matchedId) {
  return new Promise((resolve, reject) => {
    const queryString =
    `SELECT start_item_id, 
    middle_item_id, 
    end_item_id 
    FROM matches 
    WHERE matches.id = ?`;
    mysql.advancedQuery({
      queryString: queryString,
      queryCondition: [matchedId],
      queryName: 'confirmedMatchItemsData',
      DAO_name: 'matchDAO',
      reject: reject,
    }, (confirmedMatchItemsData) => {
      if (typeof confirmedMatchItemsData[0].middle_item_id !== 'number') {
        resolve({
          start_item_id: confirmedMatchItemsData[0].start_item_id,
          end_item_id: confirmedMatchItemsData[0].end_item_id,
        });
      } else {
        resolve(confirmedMatchItemsData[0]);
      }
    });
  });
}
function insertMatchRecord(idArr) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    if (idArr) {
      if (idArr.length === 3) {
        queryString =
        `INSERT INTO matches
        (start_item_id, middle_item_id, end_item_id)
        VALUES (?)`;
      } else if (idArr.length === 2) {
        queryString = `INSERT INTO
        matches (start_item_id, end_item_id)
        VALUES (?)`;
      }
      mysql.pool.query(queryString, [idArr], (err, insertMatchTableResult) => {
        if (err) {
          reject(err); return;
        }
        resolve(insertMatchTableResult.insertId);
      });
    }
  });
}

module.exports = {
  insertMatchRecord,
  getConfirmedMatchItemsId,
};
