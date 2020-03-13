const mysql = require('../util/mysql');
const crypto = require('crypto');

function checkVaildUserOfChat(token, matched_id) {
  return new Promise((resolve, reject) => {
    let queryString =
      `SELECT u.* FROM items i
      JOIN users u ON i.user_id = u.id
      JOIN matches m ON m.id = i.matched_id
      WHERE u.token = ?
      AND i.matched_id = ?`;
    mysql.advancedQuery({
      queryString: queryString,
      queryCondition: [token, matched_id],
      queryName: 'checkVaildUserOfChat',
      DAO_name: 'itemDAO',
      reject: reject,
    }, (result) => {
      let response = result.length > 0 ? result[0] : null;
      resolve(response);
    });
  });
}

/**
 * 
 * @param {*} token 
 * @param {*} item_id optional, add this param when case need to check users with item
 */
function getUserDataByToken(token, item_id) {
  return new Promise((resolve, reject) => {
    let string;
    let condition;
    if (item_id) {
      string =
        `SELECT * FROM users u 
      JOIN items i ON i.user_id = u.id 
      WHERE u.token = ? AND i.id = ?`;
      condition = [token, item_id];
    } else {
      string = 'SELECT * FROM users WHERE token = ?';
      condition = [token];
    }
    mysql.pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}

async function registerTransaction(reqBody) {
  return new Promise((resolve, reject) => {
    mysql.pool.getConnection((err, con) => {
      if (err) {
        con.release();
        reject(err);
      }
      con.beginTransaction(async (err) => {
        if (err) {
          con.rollback(() => { con.release(); });
          reject(err);
        }
        const duplicateUser = await findDuplicatedUser(reqBody.id, reqBody.name, con)
          .catch(err => {
            con.rollback(() => con.release());
            reject(err);
          });
        if (duplicateUser) {
          con.rollback(() => { con.release(); });
          resolve(duplicateUser);
        } else {
          await insertUserData({
            sign_id: reqBody.id,
            password: reqBody.password,
            nickname: reqBody.name,
          }, con)
            .catch(err => {
              con.rollback(() => { con.release(); });
              reject(err);
            })
            .then(insertUserResult => {
              con.commit((err) => {
                if (err) {
                  con.rollback(() => { con.release(); });
                  reject(err);
                } else { con.release(); }
              });
              resolve(insertUserResult);
            });
        }
      });
    });
  });

  function findDuplicatedUser(sign_id, nickname, con) {
    return new Promise((resolve, reject) => {
      let queryString = 'SELECT * FROM users WHERE sign_id = ? OR nickname = ?';
      let queryCondition = [sign_id, nickname];
      con.query(queryString, queryCondition, (err, result) => {
        if (err) {
          mysql.errLog(err, 'checkdoubleUserInfo', 'userDAO');
          reject(err);
        } else {
          let sendbackObj = {};
          if (result.length > 0) {
            let doubleIdCount = result.filter(userInfo => userInfo.sign_id === sign_id).length;
            let doubleNicknameCount = result.length - doubleIdCount;
            if (doubleIdCount === 0) {
              sendbackObj.errorMsg = '暱稱重複，請修改後再試一次';
            } else if (doubleNicknameCount === 0) {
              sendbackObj.errorMsg = 'ID重複，請修改後再試一次';
            } else {
              sendbackObj.errorMsg = 'ID與暱稱均重複，請修改後再試一次';
            }
          } else {
            sendbackObj = null;
          }
          resolve(sendbackObj);
        }
      });
    });
  }
  function insertUserData(userObj, con) {
    return new Promise((resolve, reject) => {
      // hash
      userObj.password = crypto.createHash('sha256').update(userObj.password).digest('hex');
      let token = crypto.createHash('sha256').update(userObj.id + Date.now().toString(), 'utf8').digest('hex');
      // make object
      userObj.token = token;
      userObj.time = Date.now().toString();
      let queryString = 'INSERT INTO users SET ?';
      let queryCondition = [userObj];
      con.query(queryString, queryCondition, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            token: token,
            nickname: userObj.nickname,
          });
        }
      });
    });
  }


}

function signinProcess(id, password) {
  return new Promise((resolve, reject) => {
    password = crypto.createHash('sha256').update(password).digest('hex');
    let queryString = 'SELECT * FROM users WHERE sign_id = ? AND password = ?';
    let queryCondition = [id, password];
    mysql.pool.query(queryString, queryCondition, (err, signinResult) => {
      if (err) { reject(err); return; }
      resolve(signinResult[0]);
    });
  });
}

function updateWatchMsgTime(token) {
  return new Promise((resolve, reject) => {
    const string =
      `UPDATE users u
      SET watch_msg_time = ?
      WHERE u.token = ?`;
    const condition = [Date.now(), token];
    mysql.pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      const success = result.affectedRows === 1 ? true : false;
      resolve(success);
    });
  });
}

function getLastMsgWatchedTime(token) {
  return new Promise((resolve, reject) => {
    let string =
      `SELECT u.watch_msg_time FROM users u
    WHERE u.token = ?`;
    let condition = [token];
    mysql.pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result[0].watch_msg_time);
    });
  });
}

module.exports = {
  getUserDataByToken,
  checkVaildUserOfChat,
  registerTransaction,
  signinProcess,
  updateWatchMsgTime,
  getLastMsgWatchedTime,
};