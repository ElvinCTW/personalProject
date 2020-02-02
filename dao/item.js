const mysql = require('../util/mysql');

module.exports = {
  get: () => {

  },
  // 2020/2/2 work from here!
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