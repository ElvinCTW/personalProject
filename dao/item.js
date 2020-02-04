const mysql = require('../util/mysql');
module.exports = {
  get: (queryCondition) => {
    return new Promise((resolve, reject)=>{
      let queryString = 'SELECT * FROM items ';
      if (queryCondition.type === 'all') {
        if (queryCondition.main_category) {
          if (!queryCondition.sub_category) {
            // select all by main category only
            queryString += 'WHERE main_category = ? ORDER BY time DESC LIMIT ?, 6';
            let q = mysql.pool.query(queryString, [queryCondition.main_category, queryCondition.page*6], (err, getItemResultArr, fields)=>{
              if (err) {reject(err)};
              resolve(getItemResultArr);
            }) 
          } else {
            // select all by main and sub category
            queryString += 'WHERE main_category = ? AND sub_category = ? ORDER BY time DESC LIMIT ?, 6';
            mysql.pool.query(queryString, queryCondition.main_category, queryCondition.sub_category, queryCondition.page*6, (err, getItemResultArr, fields)=>{
              if (err) {reject(err)};
              resolve(getItemResultArr);
            })
          }
        } else if (!queryCondition.user_nickname) {
          // lastest
          queryString += 'ORDER BY time DESC LIMIT ?, 6';
          mysql.pool.query(queryString, queryCondition.page*6, (err, getItemResultArr, fields)=>{
            // if (err) {reject(err)};
            // resolve(getItemResultArr);
            afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject);
          })
        } else {
          // recommand
          queryString += 'WHERE user_nickname = ? ORDER BY time DESC LIMIT ?, 6';
          mysql.pool.query(queryString, [queryCondition.user_nickname, queryCondition.page*6], (err, getItemResultArr, fields)=>{
            afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject);
          })
        } 
      } else if (queryCondition.type === 'detail') {
        // item detail info page
        queryString += 'WHERE id = ?'
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
  }
}

function afterItemsQuery(err, queryCondition, getItemResultArr, resolve, reject) {
  if (err) {reject(err)};
  if (getItemResultArr.length === 6) {
    getItemResultArr.next_paging = queryCondition.page+1;
  };
  resolve(getItemResultArr);
}