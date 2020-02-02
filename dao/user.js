const mysql = require('../util/mysql');
const crypto = require('crypto');
module.exports = {
  // get user data by log-in_id || token
  get: (userInfo)=>{
    // check id or token
    let queryColumn;
    if (userInfo.length <= 10 ) {
      // max length of id = 10
      queryColumn = 'sign_id';
    } else {
      queryColumn = 'token'
    }
    return new Promise((resolve, reject)=>{
      mysql.pool.query(`SELECT * FROM users WHERE ${queryColumn} = ?`, userInfo, (err, userData, fileds)=>{
        if (err) {
          console.log('error in getUserPromise');
          console.log(err);
          throw err;
        }
        resolve(userData);
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
      mysql.pool.query('INSERT INTO users SET ?', userObject, (err, insertUserResult, fields)=>{
        if (err) {
          console.log('error in insertUserPromise');
          console.log(err);
          reject(err);
        }
        // if insert success, send token and nickname back
        resolve({
          token: token,
          nickname: userObject.nickname,
        });
        console.log('insert user success');
      });
    })
  },
  update: (updateUserData)=>{
    // To do : update function
    return new Promise((resolve,reject)=>{
      mysql.pool.query('UPDATE users SET ? = ? WHERE sign_id = ?', [,,])
    })
  },
}