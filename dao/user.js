const mysql = require('../util/mysql');
// change to online crypto in the future ?
const crypto = require('crypto');
module.exports = {
  // get user data by log-in_id || token
  get: (queryData) => {
    return new Promise((resolve, reject) => {
      if (queryData.action === 'sign-in') {
        queryData.user.password = crypto.createHash('sha256').update(queryData.user.password).digest('hex');
        let queryString = 'SELECT * FROM users WHERE sign_id = ? AND password = ?';
        let queryCondition = [queryData.user.id, queryData.user.password];
        mysql.pool.query(queryString, queryCondition, (err, signinResult, fileds) => {
          if (err) {
            mysql.errLog(err,'signinResult','userDAO')
            reject(err)
          } else {
            console.log('signinResult')
            console.log(signinResult)
            resolve(signinResult[0])
          }
        });
      }
    });
  },
  insert: (userObject) => {
    return new Promise((resolve, reject) => {
      // hash
      userObject.password = crypto.createHash('sha256').update(userObject.password).digest('hex');
      // console.log(userObject);
      let token = crypto.createHash('sha256').update(userObject.id + Date.now().toString(), 'utf8').digest('hex');
      // console.log(token);
      // make object
      userObject.token = token;
      userObject.time = Date.now().toString();
      mysql.pool.query('INSERT INTO users SET ?', userObject, (err, insertUserResult, fields) => {
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
        // console.log('insert user success');
      });
    })
  },
}