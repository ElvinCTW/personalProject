const mysql = require('../util/mysql');
module.exports = {
  get: (queryCondition) => {
    return new Promise((resolve, reject)=>{
      let queryString = 'SELECT * FROM items ';
      if (queryCondition.type === 'all') {
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
    let queryCondition = [];
    return new Promise((resolve, reject) => {
      queryString = 'UPDATE items SET availability = "false", matched_id = ? WHERE id in (?)';
      queryCondition.length = 0;
      console.log('queryCondition')
      console.log(queryData.id_Arr)
      mysql.pool.query(queryString, [ queryData.insertMatchId ,queryData.id_Arr], (err, updateAvailbilityResult, fileds) => {
        if (err) {
          mysql.errLog(err,'updateAvailbilityResult','itemDAO')
          reject(err)
        } else {
          console.log('updateAvailbilityResult')
          console.log(updateAvailbilityResult)
          resolve(updateAvailbilityResult.affectedRows)
        }
      });
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