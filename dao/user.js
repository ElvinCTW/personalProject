const mysql = require('../util/mysql');
const crypto = require('crypto');
module.exports = {
  // get user data by log-in_id || token
  get: (userInfo)=>{
    // check id or token
    let queryString;
    if (userInfo.length <= 10 ) {
      // max length of id = 10
      queryString = `sign_id = ${userInfo}`;
    } else {
      queryString = `token = ${userInfo}`
    }
    return new Promise((resolve, reject)=>{
      mysql.pool.query('SELECT * FROM users WHERE ?', queryString, (err, getUserResult, fileds)=>{
        if (err) {
          console.log('error in getUserPromise');
          console.log(err);
          throw err;
        }
        resolve(getUserResult);
      });
    });
  },
  insert: (userObject)=>{
    return new Promise((resolve,reject)=>{
      // hash
      userObject.password = crypto.createHash('sha256').update(userObject.password).digest('hex');
      console.log(userObject);
      let token = crypto.createHash('sha256').update(userObject.id+Date.now().toString(), 'utf8').digest('hex');
      console.log(token);
      // make object
      userObject.token = token;
      userObject.time = Date.now().toString();
      const insertQueryString = 'INSERT INTO users SET ?'
      mysql.pool.query(insertQueryString, userObject, (err, insertUserResult, fields)=>{
        if (err) {
          console.log('error in insertUserPromise');
          console.log(err);
          throw err;
        }
        resolve(insertUserResult);
        console.log('insert user success');
      });
    })
  },
}