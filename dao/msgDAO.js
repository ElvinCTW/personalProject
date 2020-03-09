const { pool } = require('../util/mysql');

function markMsgAsWatched(token, id) {
  return new Promise((resolve, reject) => {
    const string =
      `UPDATE message m 
      JOIN users u ON u.id = m.receiver 
      SET m.watched = "true" 
      WHERE u.token = ? 
      AND m.watched = "false" 
      AND m.id = ?`;
    const condition = [token, id];
    pool.query(string, condition, (err, result, fileds) => {
      if (err) { reject(err); return };
      resolve(result.affectedRows);
    });
  })
}
function getMsgForHeader(token) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT m.* FROM message m 
    JOIN users u ON u.id = m.receiver 
    WHERE u.token = ? 
    ORDER BY m.time DESC
    LIMIT 0,5`;
    const condition = [token];
    pool.query(string, condition, (err, result, fileds) => {
      if (err) { reject(err); return };
      resolve(result);
    });
  })
}
function addNewMatchedPageMsg(msgObj) {
  return new Promise((resolve, reject) => {
    const queryString = '';
    msgObj.content = msgObj.content.replace(/\n/g, '\r\n')
    queryString = 'INSERT INTO message SET ?';
    pool.query(queryString, msgObj, (err, result, fileds) => {
      if (err) { reject(err); return }
      resolve(result.affectedRows)
    });
  })
}
function getLastestMsg(matchedIdArr) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    if (matchedIdArr.length > 0) {
      for (let i = 0; i < matchedIdArr.length - 1; i++) {
        queryString +=
          `(SELECT * FROM message m${i}
          WHERE m${i}.matched_id = ? 
          AND sender <> "system" 
          ORDER BY time DESC 
          LIMIT 0,1 ) 
          UNION ALL `
      }
      queryString +=
        `(SELECT * FROM message m
        WHERE m.matched_id = ? s
        AND sender <> "system" 
        ORDER BY time DESC 
        LIMIT 0,1 ) `
      pool.query(queryString, matchedIdArr, (err, result, fileds) => {
        if (err) { reject(err); return };
        resolve(result);
      });
    } else {
      resolve([])
    }
  })
}
function getConfirmedMatchMsg(matched_id) {
  return new Promise((resolve, reject) => {
    const string = 
    `SELECT content, sender, time 
    FROM message 
    WHERE matched_id = ? 
    AND sender <> "system" 
    ORDER BY time`;
    pool.query(string, [matched_id], (err, result, fileds) => {
      if (err) { reject(err); return };
      resolve(result);
    });
  })
}
function sendMsgToNoMatcher(msg) {
  return new Promise((resolve, reject) => {
    pool.query(`INSERT INTO message SET ?`, [msg], (err, result, fileds) => {
      if (err) { reject(err); return };
      resolve(result)
    });
  })
}
function insertNewMatchMsg(msgArr) {
  return new Promise((resolve, reject) => {
    let string = 'INSERT INTO message (content, sender, receiver, time, mentioned_item_id, type) values ?';
    let condition = [];
    msgArr.forEach(msg => {
      msg.push('/want/check/')
      condition.push(msg)
    })
    pool.query(string, [condition], (err, result, fileds) => {
      if (err) { reject(err); return };
      resolve(result)
    });
  })
}
function insertMatchedMsg(insertMsgQueryDataArr) {
  return new Promise((resolve, reject) => {
    let queryString = 'INSERT INTO message(content, sender, receiver, mentioned_item_id, matched_id, time, type) VALUES ?';
    pool.query(queryString, [insertMsgQueryDataArr], (err, insertMsgResult, fileds) => {
      if (err) {
        reject(err)
      } else {
        resolve(insertMsgResult.affectedRows)
      }
    });
  })
}

module.exports = {
  insertNewMatchMsg,
  sendMsgToNoMatcher,
  insertMatchedMsg,
  getConfirmedMatchMsg,
  getLastestMsg,
  addNewMatchedPageMsg,
  getMsgForHeader,
  markMsgAsWatched,
}