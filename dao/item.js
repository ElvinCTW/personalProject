const mysql = require('../util/mysql');
module.exports = {
  get: (queryCondition) => {
    return new Promise((resolve, reject)=>{
      let queryString = 'SELECT * FROM items ';
      if (queryCondition.action === 'getConfirmedMatchItemsData') {
        queryString = 'SELECT * FROM items WHERE items.id in (?)';
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
          queryString += 'WHERE id IN (?) AND availability = "true"';
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
            queryString += 'WHERE main_category = ? AND availability = "true" ORDER BY time DESC LIMIT ?, 6';
            mysql.pool.query(queryString, [queryCondition.main_category, queryCondition.page*6], (err, getItemResultArr, fields)=>{
              if (err) {reject(err)};
              resolve(getItemResultArr);
            }) 
          } else {
            // select all by main and sub category
            queryString += 'WHERE main_category = ? AND sub_category = ? AND availability = "true" ORDER BY time DESC LIMIT ?, 6';
            mysql.pool.query(queryString, queryCondition.main_category, queryCondition.sub_category, queryCondition.page*6, (err, getItemResultArr, fields)=>{
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
          queryString += 'WHERE availability = "true" ORDER BY time DESC LIMIT ?, 6';
          mysql.pool.query(queryString, queryCondition.page*6, (err, getItemResultArr, fields)=>{
            // if (err) {reject(err)};
            // resolve(getItemResultArr);
            afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject);
          })
        } else {
          // recommand
          queryString += 'WHERE user_nickname = ? AND availability = "true" ORDER BY time DESC LIMIT ?, 6';
          mysql.pool.query(queryString, [queryCondition.user_nickname, queryCondition.page*6], (err, getItemResultArr, fields)=>{
            afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject);
          })
        } 
      } else if (queryCondition.type === 'detail') {
        // item detail info page
        queryString += 'WHERE id = ? AND availability = "true"'
        mysql.pool.query(queryString, queryCondition.item_id, (err, getItemResultArr, fields)=>{
          if (err) {reject(err)};
          resolve(getItemResultArr);
        });
      } else {
        reject({msg: 'wrong query type, error in items.get()'})
      }
    })
  },
  insert: (newItemData) => {
    /** Input: user_id(optional) and item information*/
    return new Promise((resolve, reject) => {
      mysql.pool.query('INSERT INTO items SET ?', newItemData, (err, insertItemResult, fields) => {
        if (err) {
          console.log('error in insertItemPromise');
          console.log(err);
          reject(err);
        }
        // if insert success, send token and nickname back
        resolve({
          msg: 'insert suceess',
        });
        console.log('insert item success');
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
  if (getItemResultArr.length === 6) {
    getItemResultArr.next_paging = queryCondition.page+1;
  };
  resolve(getItemResultArr);
}