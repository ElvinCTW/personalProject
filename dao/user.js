const mysql = require('../util/mysql');
// change to online crypto in the future ?
const crypto = require('crypto');
module.exports = {
  get: (queryData) => {
    return new Promise((resolve, reject) => {
     if (queryData.action === 'getUserDataByItemId') {
       let queryString = 
       `SELECT u.id, i.title FROM users u
       JOIN items i ON i.user_id = u.id
       WHERE i.id = ?`;
       mysql.advancedQuery({
         queryString: queryString,
         queryCondition: [queryData.item_id],
         queryName: 'userDataOfItemId',
         DAO_name: 'userDAO',
         reject: reject,
       },(userDataOfItemId)=>{
         resolve(userDataOfItemId[0])
       })
     } else if (queryData.action === 'checkUpdateWantWithToken') {
       let queryString = 
       `SELECT * FROM users u 
       JOIN items i ON i.user_id = u.id 
       WHERE u.token = ? AND i.id = ?`;
       mysql.advancedQuery({
         queryString: queryString,
         queryCondition: [queryData.token,queryData.item_id],
         queryName: 'checkUpdateWantWithToken',
         DAO_name: 'userDAO',
         reject: reject,
       },(checkUpdateWantWithToken)=>{
         resolve(checkUpdateWantWithToken)
       })
     } else if (queryData.action === 'getUserDataByToken') {
        let queryString = 'SELECT * FROM users WHERE token = ?';
        let queryCondition = [queryData.token];
        mysql.pool.query(queryString, queryCondition, (err, userData, fileds) => {
          if (err) {
            mysql.errLog(err,'userData','userDAO')
            reject(err)
          } else {
            resolve(userData)
          }
        });
      } else if (queryData.action === 'checkdoubleUserInfo') {
        let queryString = 'SELECT * FROM users WHERE sign_id = ? OR nickname = ?';
        let queryCondition = [queryData.user.sign_id, queryData.user.nickname];
        mysql.pool.query(queryString, queryCondition, (err, checkdoubleUserInfo, fileds) => {
          if (err) {
            mysql.errLog(err,'checkdoubleUserInfo','userDAO')
            reject(err)
          } else {
            console.log('checkdoubleUserInfo')
            console.log(checkdoubleUserInfo)
            let sendbackObj = {};
            if (checkdoubleUserInfo.length > 0) {
              let doubleIdCount = checkdoubleUserInfo.filter(userInfo=>userInfo.sign_id === queryData.user.sign_id).length;
              let doubleNicknameCount = checkdoubleUserInfo.length - doubleIdCount
              if (doubleIdCount === 0) {
                sendbackObj.errorMsg = '暱稱重複，請修改後再試一次'
              } else if (doubleNicknameCount === 0) {
                sendbackObj.errorMsg = 'ID重複，請修改後再試一次'
              } else {
                sendbackObj.errorMsg = 'ID與暱稱均重複，請修改後再試一次'
              }
            } else {
              sendbackObj.successMsg = 'noDuplication'
            }
            resolve(sendbackObj)
          }
        });
      } else if (queryData.action === 'sign-in') {
        queryData.user.password = crypto.createHash('sha256').update(queryData.user.password).digest('hex');
        let queryString = 'SELECT * FROM users WHERE sign_id = ? AND password = ?';
        let queryCondition = [queryData.user.sign_id, queryData.user.password];
        mysql.pool.query(queryString, queryCondition, (err, signinResult, fileds) => {
          if (err) {
            mysql.errLog(err,'signinResult','userDAO')
            reject(err)
          } else {
            resolve(signinResult[0])
          }
        });
      } 
    });
  },
  insert: (queryData) => {
    return new Promise((resolve, reject) => {
      if (queryData.action === 'insertUser') {        
        // hash
        queryData.user.password = crypto.createHash('sha256').update(queryData.user.password).digest('hex');
        let token = crypto.createHash('sha256').update(queryData.user.id + Date.now().toString(), 'utf8').digest('hex');
        // make object
        queryData.user.token = token;
        queryData.user.time = Date.now().toString();
        let queryString = 'INSERT INTO users SET ?';
        let queryCondition = [queryData.user];
        mysql.pool.query(queryString, queryCondition, (err, insertUser, fileds) => {
          if (err) {
            mysql.errLog(err,'insertUser','userDAO')
            reject(err)
          } else {
            resolve({
              token: token,
              nickname: queryData.user.nickname,
            })
          }
        });
      }
    })
  },
}