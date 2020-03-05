const mysql = require('../util/mysql');

function getItemDataByType(page, category, nickname) {
  return new Promise((resolve, reject) => {
    if (nickname) {
      let string = mysql.itemJoinString + 'WHERE u.nickname = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
      let condition = [nickname, page * 20];
      mysql.pool.query(string, condition, (err, result, fileds) => {
        if (err) {
          let functionName = arguments.callee.toString();
          functionName = functionName.substr('function '.length);
          functionName = functionName.substr(0, functionName.indexOf('('));
          mysql.errLog(err, functionName, __filename)
          reject(err)
        } else {
          resolve(result)
        }
      });
    } else if (category.main_category) {
      let string;
      let condition;
      if (!category.sub_category) {
        // select all by main category only
        string = mysql.itemJoinString + 'WHERE i.main_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
        condition = [category.main_category, page * 20]
      } else {
        if (!category.status) {
          // select all by main and sub category
          string = mysql.itemJoinString + 'WHERE i.main_category = ? AND i.sub_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
          condition = [category.main_category, category.sub_category, page * 20]
        } else {
          // select all by main and sub category and status
          string = mysql.itemJoinString + 'WHERE i.main_category = ? AND i.sub_category = ? AND i.status = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
          condition = [category.main_category, category.sub_category, category.status, page * 20]
        }
      }
      mysql.advancedQuery({
        queryString: string,
        queryCondition: condition,
        queryName: 'getItemResultArr',
        DAO_name: 'itemDAO',
        reject: reject,
      }, (getItemResultArr) => {
        resolve(getItemResultArr)
      })
    } else  {
      // lastest
      mysql.advancedQuery({
        queryString: mysql.itemJoinString + 'WHERE i.availability = "true" ORDER BY i.time DESC LIMIT ?, 20',
        queryCondition: [page * 20],
        queryName: 'lastestItemsData',
        DAO_name: 'itemDAO',
        reject: reject,
      }, (lastestItemsData) => {
        if (lastestItemsData.length === 20) { lastestItemsData.next_paging = lastestItemsData.page + 1 };
        resolve(lastestItemsData)
      })
    } 
  })
}

function insertNewItem(data) {
  return new Promise((resolve, reject) => {
    mysql.pool.query('INSERT INTO items SET ?', data, (err, insertItem, fields) => {
      console.log('data in itemDAO ,insert')
      console.log(data)
      if (err) {
        mysql.errLog(err, 'insertItem', 'itemDAO')
        reject(err)
      } else {
        resolve(insertItem);
      }
    })
  })
}

function getHotBoardList() {
  return new Promise((resolve, reject) => {
    let string = 'SELECT main_category hot_board, COUNT(*) count FROM items GROUP BY main_category ORDER BY count DESC LIMIT 0,500';
    // let data = [];
    mysql.pool.query(string, (err, hotCountsResult, fileds) => {
      if (err) {
        mysql.errLog(err, 'hotCountsResult', 'itemDAO')
        reject(err)
      } else {
        console.log('hotCountsResult')
        console.log(hotCountsResult)
        resolve(hotCountsResult)
      }
    });
  })
}

function getConfirmedMatchItemsData(idArr) {
  return new Promise((resolve, reject) => {
    let string = mysql.itemJoinString + 'WHERE i.id in (?)';
    mysql.pool.query(string, [idArr], (err, getConfirmedMatchItemsDataResult, fileds) => {
      if (err) {
        mysql.errLog(err, 'getConfirmedMatchItemsDataResult', 'itemDAO')
        reject(err)
      } else {
        resolve(getConfirmedMatchItemsDataResult)
      }
    });
  })
}

function getItemDataByIdArr(idArr) {
  return new Promise((resolve, reject) => {
    let string = mysql.itemJoinString + 'WHERE i.id IN (?) AND i.availability = "true"';
    mysql.pool.query(string, [idArr], (err, getItemResultArr, fields) => {
      if (err) {
        console.log(err.sqlMessage);
        console.log(err.sql);
        reject(err)
      };
      resolve(getItemResultArr);
    })
  })
}

function getConfirmedMatches(token) {
  return new Promise((resolve, reject) => {
    string =
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
    mysql.pool.query(string, [token], (err, result, fileds) => {
      if (err) {
        mysql.errLog(err, 'result', 'itemDAO')
        reject(err)
      } else {
        resolve(result);
      }
    });
  })
}

async function getItemDataFromSearchBar(titleArr, hashtagArr) {
  return new Promise((resolve, reject) => {
    let queryString =
      `SELECT *, COUNT(*) counts FROM ( `;
    // add keywords
    let count = 1;
    if (titleArr.length > 0) {
      for (let i = 1; i < titleArr.length + 1; i++) {
        queryString +=
          `SELECT i${i}.* 
        FROM items i${i}
        WHERE i${i}.title
        LIKE ? 
        UNION ALL `
        count++
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
        UNION ALL `
      }
    }
    // 蓋子
    queryString +=
      `SELECT i.* FROM items i WHERE i.id < 0 ) total 
      GROUP BY id ORDER BY counts DESC`
    let queryCondition = titleArr.concat(hashtagArr).map(word => `%${word}%`)
    mysql.advancedQuery({
      queryString: queryString,
      queryCondition: queryCondition,
      queryName: 'itemsIdOfKeyword',
      DAO_name: 'itemDAO',
      reject: reject,
    }, (itemsIdOfKeyword) => {
      resolve(itemsIdOfKeyword)
    })
  })
}

async function getItemDetail(itemId, gone) {
  return new Promise((resolve, reject) => {
    let string;
    if (!gone) {
      string = mysql.itemJoinString + 'WHERE i.id = ? AND i.availability = "true"'
    } else {
      string = mysql.itemJoinString + 'WHERE i.id = ? AND i.availability = "false"'
    }
    mysql.advancedQuery({
      queryString: string,
      queryCondition: [itemId],
      queryName: 'itemDetailResult',
      DAO_name: 'itemDAO',
      reject: reject,
    }, (itemDetailResult) => {
      resolve(itemDetailResult[0])
    })
  })
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
        con.query(string, [insertedMatchId, id_Arr[(i + 1) % id_Arr.length], id_Arr[i % id_Arr.length]], (err, updateAvailbilityResult, fileds) => {
          if (err) {
            mysql.errLog(err, 'updateAvailbilityResult', 'itemDAO')
            con.rollback(() => { con.release() })
            reject(err)
          } else {
            updateAvailabilitiesCount += updateAvailbilityResult.affectedRows
            if (i === id_Arr.length - 1) {
              if (updateAvailabilitiesCount !== id_Arr.length) {
                console.log('updateAvailabilitiesCount is not identical with id_Arr.length, updateAvailabilitiesCount is :');
                console.log(updateAvailabilitiesCount);
              }
              resolve(updateAvailabilitiesCount);
            }
          }
        });
      }
    } else {
      mysql.pool.query(string, [id_Arr], (err, result, fileds) => {
        if (err) {
          let functionName = arguments.callee.toString();
          functionName = functionName.substr('function '.length);
          functionName = functionName.substr(0, functionName.indexOf('('));
          mysql.errLog(err, functionName, __filename)
          reject(err)
        } else {
          if (result.affectedRows !== 1) { console.log(`discontinueItem err, actually count ${result.affectedRows}`); }
          resolve()
        }
      });
    }
  })
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
}