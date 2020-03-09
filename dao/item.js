const { pool, itemJoinString } = require('../util/mysql');

function getItemDataByType(page, category, nickname) {
  return new Promise((resolve, reject) => {
    if (nickname) {
      const string = itemJoinString + 'WHERE u.nickname = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
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
        string = itemJoinString + 'WHERE i.main_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
        condition = [category.main_category, page * 20];
      } else {
        if (!category.status) {
          // select all by main and sub category
          string = itemJoinString + 'WHERE i.main_category = ? AND i.sub_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
          condition = [category.main_category, category.sub_category, page * 20];
        } else {
          // select all by main and sub category and status
          string = itemJoinString + 'WHERE i.main_category = ? AND i.sub_category = ? AND i.status = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
          condition = [category.main_category, category.sub_category, category.status, page * 20];
        }
      }
      pool.query(string, condition, (err, result) => {
        if (err) { reject(err); return; }
        resolve(result);
      });
    } else {
      // lastest
      const string = itemJoinString + 'WHERE i.availability = "true" ORDER BY i.time DESC LIMIT ?, 20';
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
    pool.query('INSERT INTO items SET ?', data, (err, insertItem) => {
      if (err) { reject(err); return; }
      resolve(insertItem);
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
      i2.pictures required_item_pictures,
      i2.tags required_item_tags
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
        UNION ALL `;
        count++;
      }
    }
    // add tags
    if (hashtagArr.length > 0) {
      for (let j = count; j < hashtagArr.length + count; j++) {
        queryString +=
          `SELECT i${j}.*
        FROM items i${j}
        WHERE i${j}.tags
        LIKE ?
        UNION ALL `;
      }
    }
    // 蓋子
    queryString +=
      `SELECT i.* FROM items i WHERE i.id < 0 ) total 
      GROUP BY id ORDER BY counts DESC`;
    let queryCondition = titleArr.concat(hashtagArr).map(word => `%${word}%`);
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
      resolve(result[0]);
    });
  });
}

/**
 * 
 * @param {*} id_Arr single ID or ID array
 * @param {*} insertedMatchId optional, only work for matched discontinue
 */
function discontinueItem(id_Arr, insertedMatchId, con) {
  // update items // turn item / availability to false
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