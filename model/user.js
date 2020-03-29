/* eslint-disable require-jsdoc */
const mysql = require('../util/mysql');
const crypto = require('crypto');

function checkVaildUserOfChat(token, matchedId) {
  return new Promise((resolve, reject) => {
    const queryString =
      `SELECT u.* FROM items i
      JOIN users u ON i.user_id = u.id
      JOIN matches m ON m.id = i.matched_id
      WHERE u.token = ?
      AND i.matched_id = ?`;
    mysql.advancedQuery({
      queryString: queryString,
      queryCondition: [token, matchedId],
      queryName: 'checkVaildUserOfChat',
      DAO_name: 'itemDAO',
      reject: reject,
    }, (result) => {
      const response = result.length > 0 ? result[0] : null;
      resolve(response);
    });
  });
}

/**
 *
 * @param {string} token
 * @param {number} itemId optional, add this when checking owner of item
 * @return {object} user data
 */
function getUserDataByToken(token, itemId) {
  return new Promise((resolve, reject) => {
    let string;
    let condition;
    if (itemId) {
      string =
        `SELECT * FROM users u 
      JOIN items i ON i.user_id = u.id 
      WHERE u.token = ? AND i.id = ?`;
      condition = [token, itemId];
    } else {
      string = 'SELECT * FROM users WHERE token = ?';
      condition = [token];
    }
    mysql.pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err); return;
      }
      resolve(result);
    });
  });
}

function getUserDataByColumn(table, value) {
  return new Promise((resolve, reject) => {
    const string = 'SELECT * FROM users WHERE ? = ?';
    const condition = [table, value];
    mysql.pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err); return;
      }
      resolve(result[0]);
    });
  });
}

async function registerTransaction(req) {
  return new Promise((resolve, reject) => {
    mysql.pool.getConnection((err, con) => {
      if (err) {
        con.release();
        reject(err);
      }
      con.beginTransaction(async (err) => {
        if (err) {
          con.rollback(() => {
            con.release();
          });
          reject(err);
        }
        const duplicateUser =await findDuplicatedUser(req.id, req.name, con)
            .catch((err) => {
              con.rollback(() => con.release());
              reject(err);
            });
        if (duplicateUser) {
          con.rollback(() => {
            con.release();
          });
          resolve(duplicateUser);
        } else {
          await insertUserData({
            sign_id: req.id,
            password: req.password,
            nickname: req.name,
          }, con)
              .catch((err) => {
                con.rollback(() => {
                  con.release();
                });
                reject(err);
              })
              .then((insertUserResult) => {
                con.commit((err) => {
                  if (err) {
                    con.rollback(() => {
                      con.release();
                    });
                    reject(err);
                  } else {
                    con.release();
                  }
                });
                resolve(insertUserResult);
              });
        }
      });
    });
  });

  function findDuplicatedUser(signId, nickname, con) {
    return new Promise((resolve, reject) => {
      const string = 'SELECT * FROM users WHERE sign_id = ? OR nickname = ?';
      const queryCondition = [signId, nickname];
      con.query(string, queryCondition, (err, result) => {
        if (err) {
          mysql.errLog(err, 'checkdoubleUserInfo', 'userDAO');
          reject(err);
        } else {
          let sendbackObj = {};
          if (result.length > 0) {
            const doubleIdCount = result
                .filter((userInfo) => userInfo.sign_id === signId).length;
            const doubleNicknameCount = result.length - doubleIdCount;
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
      userObj.password =
      crypto.createHash('sha256')
          .update(userObj.password)
          .digest('hex');
      const token =
      crypto.createHash('sha256')
          .update(userObj.id + Date.now().toString(), 'utf8')
          .digest('hex');
      // make object
      userObj.token = token;
      const string = 'INSERT INTO users SET ?';
      const queryCondition = [userObj];
      con.query(string, queryCondition, (err) => {
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

function signInUser(id, password) {
  return new Promise((resolve, reject) => {
    password = crypto.createHash('sha256').update(password).digest('hex');
    const string = 'SELECT * FROM users WHERE sign_id = ? AND password = ?';
    const queryCondition = [id, password];
    mysql.pool.query(string, queryCondition, (err, signinResult) => {
      if (err) {
        reject(err); return;
      }
      resolve(signinResult[0]);
    });
  });
}

function updateWatchMsgTime(token) {
  return new Promise((resolve, reject) => {
    const string =
      `UPDATE users u
      SET watch_msg_time = NOW()
      WHERE u.token = ?`;
    const condition = [token];
    mysql.pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err); return;
      }
      const success = result.affectedRows === 1 ? true : false;
      resolve(success);
    });
  });
}

function getLastMsgWatchedTime(token) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT u.watch_msg_time FROM users u
    WHERE u.token = ?`;
    const condition = [token];
    mysql.pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err); return;
      }
      resolve(result[0].watch_msg_time);
    });
  });
}


module.exports = {
  getUserDataByToken,
  getUserDataByColumn,
  checkVaildUserOfChat,
  registerTransaction,
  signInUser,
  updateWatchMsgTime,
  getLastMsgWatchedTime,
};
