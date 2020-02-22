const mysql = require('../util/mysql');
module.exports = {
  get: (queryCondition) => {
    return new Promise((resolve, reject)=>{
      if (queryCondition.action === 'getHotCounts') {
        let queryString = 'SELECT main_category hot_board, COUNT(*) count FROM items GROUP BY main_category ORDER BY count DESC LIMIT 0,500';
        // let queryCondition = [];
        mysql.pool.query(queryString, (err, hotCountsResult, fileds) => {
          if (err) {
            mysql.errLog(err,'hotCountsResult','itemDAO')
            reject(err)
          } else {
            console.log('hotCountsResult')
            console.log(hotCountsResult)
            resolve(hotCountsResult)
          }
        });
      } else if (queryCondition.action === 'getConfirmedMatchItemsData') {
        let queryString = mysql.itemJoinString+'WHERE i.id in (?)';
        mysql.pool.query(queryString, [queryCondition.idArr], (err, getConfirmedMatchItemsDataResult, fileds) => {
          if (err) {
            mysql.errLog(err,'getConfirmedMatchItemsDataResult','itemDAO')
            reject(err)
          } else {
            // console.log('getConfirmedMatchItemsDataResult')
            // console.log(getConfirmedMatchItemsDataResult)
            resolve(getConfirmedMatchItemsDataResult)
          }
        });
      } else if (queryCondition.type === 'all') {
        if (queryCondition.id_Arr) {
          // get data for id_Arr
          let queryString = mysql.itemJoinString+'WHERE i.id IN (?) AND i.availability = "true"';
          mysql.pool.query(queryString, [queryCondition.id_Arr], (err, getItemResultArr, fields)=>{
            if (err) {
              console.log(err.sqlMessage);
              console.log(err.sql);
              reject(err)
            };
            resolve(getItemResultArr);
          }) 
        } else if (queryCondition.main_category) {
          if (!queryCondition.sub_category) {
            // select all by main category only
            let queryString = mysql.itemJoinString+'WHERE i.main_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
            mysql.pool.query(queryString, [queryCondition.main_category, queryCondition.page*20], (err, getItemResultArr, fields)=>{
              if (err) {reject(err)};
              resolve(getItemResultArr);
            }) 
          } else {
            // select all by main and sub category
            let queryString = mysql.itemJoinString+'WHERE i.main_category = ? AND i.sub_category = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
            mysql.pool.query(queryString, queryCondition.main_category, queryCondition.sub_category, queryCondition.page*20, (err, getItemResultArr, fields)=>{
              if (err) {reject(err)};
              resolve(getItemResultArr);
            })
          }
        } else if (queryCondition.action === 'getConfirmedMatches') { 
          queryString = 'SELECT i.matched_id, i2.title required_item_title FROM items i JOIN items i2 ON i.matched_item_id = i2.id WHERE i.availability = "false" AND i.matched_id > 0 AND i.user_nickname = ?';
          mysql.pool.query(queryString, [queryCondition.user_nickname], (err, getConfirmedMatchesResult, fileds) => {
            if (err) {
              mysql.errLog(err,'getConfirmedMatchesResult','itemDAO')
              reject(err)
            } else {
              // console.log('getConfirmedMatchesResult')
              // console.log(getConfirmedMatchesResult)
              resolve(getConfirmedMatchesResult);
            }
          });
        } else if (!queryCondition.user_nickname) {
          // lastest
          let queryString = mysql.itemJoinString+'WHERE i.availability = "true" ORDER BY i.time DESC LIMIT ?, 20';
          mysql.pool.query(queryString, queryCondition.page*20, (err, getItemResultArr, fields)=>{
            // if (err) {reject(err)};
            // resolve(getItemResultArr);
            afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject);
          })
        } else {
          // recommand
          queryString += 'WHERE user_nickname = ? AND i.availability = "true" ORDER BY time DESC LIMIT ?, 20';
          mysql.pool.query(queryString, [queryCondition.user_nickname, queryCondition.page*20], (err, getItemResultArr, fields)=>{
            afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject);
          })
        } 
      } else if (queryCondition.type === 'detail') {
        // item detail info page
        let queryString = mysql.itemJoinString+'WHERE i.id = ? AND i.availability = "true"'
        mysql.pool.query(queryString, queryCondition.item_id, (err, getItemResultArr, fields)=>{
          if (err) {reject(err)};
          resolve(getItemResultArr);
        });
      } else {
        reject({msg: 'wrong query type, error in items.get()'})
      }
    })
  },
  insert: (queryData) => {
    /** Input: user_id(optional) and item information*/
    return new Promise((resolve, reject) => {
      mysql.pool.query('INSERT INTO items SET ?', queryData, (err, insertItem, fields) => {
        if (err) {
          mysql.errLog(err,'insertItem','itemDAO')
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
  update: (queryData)=>{
    // update items // turn item / availability to false
    let queryString;
    let updateAvailabilitiesCount = 0;
    let id_Arr = queryData.id_Arr;
    return new Promise((resolve, reject) => {
      for (let i =0; i < id_Arr.length; i++ ) {
        // queryString = 'UPDATE items SET availability = "false", matched_id = ? WHERE id in (?)';
        queryString = 'UPDATE items SET availability = "false", matched_id = ?, matched_item_id = ? WHERE id = ?';
        mysql.pool.query(queryString, [ queryData.insertMatchId ,id_Arr[(i+1)%id_Arr.length] ,id_Arr[i%id_Arr.length]], (err, updateAvailbilityResult, fileds) => {
          if (err) {
            mysql.errLog(err,'updateAvailbilityResult','itemDAO')
            reject(err)
          } else {
            // console.log('updateAvailbilityResult')
            // console.log(updateAvailbilityResult)
            updateAvailabilitiesCount += updateAvailbilityResult.affectedRows
            if (i = id_Arr.length-1) {
              resolve(updateAvailabilitiesCount);
            }
          }
        });
      }
    })
  }
}

function afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject) {
  if (err) {reject(err)};
  if (getItemResultArr.length === 20) {
    getItemResultArr.next_paging = queryCondition.page+1;
  };
  resolve(getItemResultArr);
}