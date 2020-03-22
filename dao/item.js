const { pool, itemJoinString } = require('../util/mysql');
const moment = require('moment');
moment.locale('zh-tw');

function getItemDataByType(page, category, nickname) {
  return new Promise((resolve, reject) => {
    if (nickname) {
      const string = itemJoinString + 'WHERE u.nickname = ? AND i.availability = "true" ORDER BY i.id DESC LIMIT ?, 20';
      const condition = [nickname, page * 20];
      pool.query(string, condition, (err, result) => {
        if (err) { reject(err); return; }
        resolve(result);
      });
    } else if (category.main_category) {
      let string;
      let condition;
      if (!category.sub_category) {
        // select all by main category only
        string = itemJoinString + 'WHERE ic.main_category_id = ? AND i.availability = "true" ORDER BY i.id DESC LIMIT ?, 20';
        condition = [category.main_category, page * 20];
      } else {
        if (!category.status) {
          // select all by main and sub category
          string = itemJoinString + 'WHERE ic.main_category_id = ? AND ic.sub_category_id = ? AND i.availability = "true" ORDER BY i.id  DESC LIMIT ?, 20';
          condition = [category.main_category, category.sub_category, page * 20];
        } else {
          // select all by main and sub category and status
          string = itemJoinString + 'WHERE ic.main_category_id = ? AND ic.sub_category_id = ? AND i.status = ? AND i.availability = "true" ORDER BY i.id DESC LIMIT ?, 20';
          condition = [category.main_category, category.sub_category, category.status, page * 20];
        }
      }
      pool.query(string, condition, (err, result) => {
        if (err) { reject(err); return; }
        resolve(result);
      });
    } else {
      // latest
      const string = itemJoinString + 'WHERE i.availability = "true" ORDER BY i.id DESC LIMIT ?, 20';
      const condition = [page * 20];
      pool.query(string, condition, (err, result) => {
        if (err) { reject(err); console.log(err); return; }
        if (result.length === 20) { result.next_paging = page + 1; }
        resolve(result);
      });
    }
  });
}

function insertNewItem(data) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO items SET ?', data, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

function getHotBoardList() {
  return new Promise((resolve, reject) => {
    let string = 'SELECT main_category hot_board, COUNT(*) count FROM items GROUP BY main_category ORDER BY count DESC LIMIT 0,500';
    // let data = [];
    pool.query(string, (err, hotCountsResult) => {
      if (err) { reject(err); return; }
      resolve(hotCountsResult);
    });
  });
}

function getConfirmedMatchItemsData(idArr) {
  return new Promise((resolve, reject) => {
    let string = itemJoinString + 'WHERE i.id in (?)';
    pool.query(string, [idArr], (err, getConfirmedMatchItemsDataResult) => {
      if (err) { reject(err); return; }
      resolve(getConfirmedMatchItemsDataResult);
    });
  });
}

function getItemDataByIdArr(idArr) {
  return new Promise((resolve, reject) => {
    let string = itemJoinString + 'WHERE i.id IN (?) AND i.availability = "true"';
    pool.query(string, [idArr], (err, getItemResultArr) => {
      if (err) { reject(err); return; }
      resolve(getItemResultArr);
    });
  });
}

function getConfirmedMatches(token) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT i.matched_id, 
      i2.title required_item_title, 
      i2.pictures required_item_pictures
      FROM items i 
      JOIN items i2 ON i.matched_item_id = i2.id 
      JOIN users u ON i.user_id = u.id 
      WHERE i.availability = "false" 
      AND i.matched_id > 0 
      AND u.token = ?
      ORDER BY matched_id DESC`;
    pool.query(string, [token], (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

async function getItemDataFromSearchBar(titleArr, hashtagArr) {
  return new Promise((resolve, reject) => {
    let queryString =
      'SELECT *, COUNT(*) counts FROM ( ';
    // add keywords
    let count = 1;
    if (titleArr.length > 0) {
      for (let i = 1; i < titleArr.length + 1; i++) {
        queryString +=
          `SELECT i${i}.* 
        FROM items i${i}
        WHERE i${i}.title
        LIKE ? 
        AND i${i}.availability = "true"
        UNION ALL `;
        count++;
      }
    }
    // add tags
    if (hashtagArr.length > 0) {
      for (let j = count; j < hashtagArr.length + count; j++) {
        queryString +=
          `SELECT i${j}.*
        FROM item_tags it${j}
        JOIN items i${j} ON i${j}.id = it${j}.item_id
        JOIN tags t${j} ON t${j}.id = it${j}.tag_id
        WHERE t${j}.tag = ?
        AND i${j}.availability = "true"
        UNION ALL `;
      }
    }
    // 蓋子
    queryString +=
      `SELECT i.* FROM items i WHERE i.id < 0 ) total 
      GROUP BY id ORDER BY counts DESC`;
    let queryCondition = titleArr.map(word => `%${word}%`).concat(hashtagArr);
    pool.query(queryString, queryCondition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

async function getItemDetail(itemId, gone) {
  return new Promise((resolve, reject) => {
    let string;
    if (!gone) {
      string = itemJoinString + 'WHERE i.id = ? AND i.availability = "true"';
    } else {
      string = itemJoinString + 'WHERE i.id = ? AND i.availability = "false"';
    }
    let condition = [itemId];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      let response = result.length > 0 ? result[0] : {};
      if (result.length > 0) {
        result[0].create_time = moment(result[0].create_time).utc().zone(-8).format('lll');
      }
      resolve(response);
    });
  });
}

/**
 * 
 * @param {*} id_Arr single ID or ID array
 * @param {*} insertedMatchId optional, only work for matched discontinue
 */
function discontinueItem(id_Arr, insertedMatchId, con) {
  // update items 
  // turn item / availability to false
  let updateAvailabilitiesCount = 0;
  return new Promise((resolve, reject) => {
    let string = insertedMatchId ?
      'UPDATE items SET availability = "false", matched_id = ?, matched_item_id = ? WHERE id = ?' :
      'UPDATE items SET availability = "false" WHERE id = ?';
    if (insertedMatchId) {
      for (let i = 0; i < id_Arr.length; i++) {
        con.query(string, [insertedMatchId, id_Arr[(i + 1) % id_Arr.length], id_Arr[i % id_Arr.length]], (err, updateAvailbilityResult) => {
          if (err) { reject(err); con.rollback(() => { con.release(); }); return; }
          updateAvailabilitiesCount += updateAvailbilityResult.affectedRows;
          if (i === id_Arr.length - 1) {
            if (updateAvailabilitiesCount !== id_Arr.length) {
              console.log('updateAvailabilitiesCount is not identical with id_Arr.length, updateAvailabilitiesCount is :');
              console.log(updateAvailabilitiesCount);
            }
            resolve(updateAvailabilitiesCount);
          }

        });
      }
    } else {
      pool.query(string, [id_Arr], (err, result) => {
        if (err) { reject(err); return; }
        if (result.affectedRows !== 1) { console.log(`discontinueItem err, actually count ${result.affectedRows}`); }
        resolve();
      });
    }
  });
}

module.exports = {
  getItemDataByIdArr,
  getItemDataFromSearchBar,
  getItemDetail,
  getHotBoardList,
  getConfirmedMatches,
  getConfirmedMatchItemsData,
  getItemDataByType,
  discontinueItem,
  insertNewItem,
};