const mysql = require('../util/mysql');
module.exports = {
  get: (data) => {
    return new Promise((resolve, reject) => {
      if (data.action === 'getItemDataFromSearchBar') {
        let queryString =
          `SELECT *, COUNT(*) counts FROM ( `;
        // add keywords
        let count = 1;
        console.log('data')
        console.log(data)
        if (data.titleArr.length > 0) {
          console.log('data.titleArr.length')
          console.log(data.titleArr.length)
          for (let i = 1; i < data.titleArr.length+1; i++) {
            queryString +=
              `SELECT i${i}.* 
              FROM items i${i}
              WHERE i${i}.title
              LIKE ? 
              UNION ALL `
            count++
            console.log('yo');
          }
        }
        // add tags
        if (data.hashtagArr.length > 0) {
          for (let j = count; j < data.hashtagArr.length+count; j++) {
            queryString +=
              `SELECT i${j}.*
              FROM items i${j}
              WHERE i${j}.tags
              LIKE ?
              UNION ALL `
          }
        }
        // 蓋子
        queryString+=
        `SELECT i.* FROM items i WHERE i.id < 0 ) total 
        GROUP BY id ORDER BY counts DESC`
        console.log('data.titleArr.concat(data.hashtagArr)')
        console.log(data.titleArr.concat(data.hashtagArr))
        let queryCondition = data.titleArr.concat(data.hashtagArr).map(word=>`%${word}%`)
        mysql.advancedQuery({
          queryString: queryString,
          queryCondition: queryCondition,
          queryName: 'itemsIdOfKeyword',
          DAO_name: 'itemDAO',
          reject: reject,
        }, (itemsIdOfKeyword) => {
          console.log('queryString')
          console.log(queryString)
          console.log('itemsIdOfKeyword')
          console.log(itemsIdOfKeyword)
          resolve(itemsIdOfKeyword)
        })
      } else if (data.action === 'checkVaildUserOfMatchDialog') {
        let queryString =
          `SELECT * FROM items i
        JOIN users u ON i.user_id = u.id
        JOIN matched m ON m.id = i.matched_id
        WHERE u.token = ?
        AND i.matched_id = ?`;
        mysql.advancedQuery({
          queryString: queryString,
          queryCondition: [data.token, data.matched_id],
          queryName: 'checkVaildUserOfMatchDialog',
          DAO_name: 'itemDAO',
          reject: reject,
        }, (checkVaildUserOfMatchDialog) => {
          resolve(checkVaildUserOfMatchDialog)
        })
      } else if (data.action === 'getHotCounts') {
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
      } else if (data.action === 'getConfirmedMatchItemsData') {
        let string = mysql.itemJoinString + 'WHERE i.id in (?)';
        mysql.pool.query(string, [data.idArr], (err, getConfirmedMatchItemsDataResult, fileds) => {
          if (err) {
            mysql.errLog(err, 'getConfirmedMatchItemsDataResult', 'itemDAO')
            reject(err)
          } else {
            // console.log('getConfirmedMatchItemsDataResult')
            // console.log(getConfirmedMatchItemsDataResult)
            resolve(getConfirmedMatchItemsDataResult)
          }
        });
      } else if (data.type === 'all') {
        let string;
        let condition;
        if (data.id_Arr) {
          // get data for id_Arr
          string = mysql.itemJoinString + 'WHERE i.id IN (?) AND i.availability = "true"';
          mysql.pool.query(string, [data.id_Arr], (err, getItemResultArr, fields) => {
            if (err) {
              console.log(err.sqlMessage);
              console.log(err.sql);
              reject(err)
            };
            resolve(getItemResultArr);
          })
        } else if (data.main_category) {
          if (!data.sub_category) {
            // select all by main category only
            string = mysql.itemJoinString + 'WHERE i.main_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
            condition = [data.main_category, data.page * 20]
          } else {
            if (!data.status) {
              // select all by main and sub category
              string = mysql.itemJoinString + 'WHERE i.main_category = ? AND i.sub_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
              condition = [data.main_category, data.sub_category, data.page * 20]
            } else {
              // select all by main and sub category and status
              string = mysql.itemJoinString + 'WHERE i.main_category = ? AND i.sub_category = ? AND i.status = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
              condition = [data.main_category, data.sub_category, data.status, data.page * 20]
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
        } else if (data.action === 'getConfirmedMatches') {
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
          AND u.token = ?`;
          mysql.pool.query(string, [data.token], (err, getConfirmedMatchesResult, fileds) => {
            if (err) {
              mysql.errLog(err, 'getConfirmedMatchesResult', 'itemDAO')
              reject(err)
            } else {
              resolve(getConfirmedMatchesResult);
            }
          });
        } else if (!data.user_nickname) {
          // lastest
          mysql.advancedQuery({
            queryString: mysql.itemJoinString + 'WHERE i.availability = "true" ORDER BY i.time DESC LIMIT ?, 20',
            queryCondition: [data.page * 20],
            queryName: 'lastestItemsData',
            DAO_name: 'itemDAO',
            reject: reject,
          }, (lastestItemsData) => {
            if (lastestItemsData.length === 20) { lastestItemsData.next_paging = lastestItemsData.page + 1 };
            resolve(lastestItemsData)
          })
        } else {
          // recommand
          mysql.advancedQuery({
            queryString: mysql.itemJoinString + 'WHERE u.nickname = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20',
            queryCondition: [data.user_nickname, data.page * 20],
            queryName: 'recommendItemsData',
            DAO_name: 'itemDAO',
            reject: reject,
          }, (recommendItemsData) => {
            if (recommendItemsData.length === 20) { recommendItemsData.next_paging = recommendItemsData.page + 1 };
            resolve(recommendItemsData)
          })
        }
      } else if (data.type === 'detail') {
        mysql.advancedQuery({
          queryString: mysql.itemJoinString + 'WHERE i.id = ? AND i.availability = "true"',
          queryCondition: [data.item_id],
          queryName: 'itemDetailResult',
          DAO_name: 'itemDAO',
          reject: reject,
        }, (itemDetailResult) => {
          resolve(itemDetailResult)
        })
      } else {
        reject({ msg: 'wrong query type, error in items.get()' })
      }
    })
  },
  insert: (data) => {
    /** Input: user_id(optional) and item information*/
    return new Promise((resolve, reject) => {
      mysql.pool.query('INSERT INTO items SET ?', data, (err, insertItem, fields) => {
        if (err) {
          mysql.errLog(err, 'insertItem', 'itemDAO')
          reject(err)
        } else {
          console.log('insertItem')
          console.log(insertItem)
          resolve(insertItem);
        }
      })
    })
    /** To do: insert data to db */
    /** Output: Success or error msg*/
  },
  update: (data) => {
    // update items // turn item / availability to false
    let string;
    let updateAvailabilitiesCount = 0;
    let id_Arr = data.id_Arr;
    console.log('id_Arr')
    console.log(id_Arr)
    return new Promise((resolve, reject) => {
      for (let i = 0; i < id_Arr.length; i++) {
        // string = 'UPDATE items SET availability = "false", matched_id = ? WHERE id in (?)';
        string = 'UPDATE items SET availability = "false", matched_id = ?, matched_item_id = ? WHERE id = ?';
        mysql.pool.query(string, [data.insertMatchId, id_Arr[(i + 1) % id_Arr.length], id_Arr[i % id_Arr.length]], (err, updateAvailbilityResult, fileds) => {
          if (err) {
            mysql.errLog(err, 'updateAvailbilityResult', 'itemDAO')
            reject(err)
          } else {
            // console.log('updateAvailbilityResult')
            // console.log(updateAvailbilityResult)
            updateAvailabilitiesCount += updateAvailbilityResult.affectedRows
            // console.log('i')
            // console.log(i)
            // console.log('updateAvailabilitiesCount')
            // console.log(updateAvailabilitiesCount)
            // console.log('updateAvailbilityResult.affectedRows')
            // console.log(updateAvailbilityResult.affectedRows)
            if (i === id_Arr.length - 1) {
              // console.log('i, when out')
              // console.log(i)
              resolve(updateAvailabilitiesCount);
            }
          }
        });
      }
    })
  }
}