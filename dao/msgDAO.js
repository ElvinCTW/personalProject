const { pool } = require('../util/mysql');
const moment = require('moment');
moment.locale('zh-tw');

function markMsgAsWatched(token, id) {
  return new Promise((resolve, reject) => {
    const string =
      `UPDATE messages m 
      JOIN users u ON u.id = m.receiver 
      SET m.watched = 1 
      WHERE u.token = ? 
      AND m.watched = 0
      AND m.id = ?`;
    const condition = [token, id];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result.affectedRows);
    });
  });
}
function getMsgForHeader(token) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT m.* FROM messages m 
    JOIN users u ON u.id = m.receiver 
    WHERE u.token = ? 
    ORDER BY m.create_time DESC
    LIMIT 0,5`;
    const condition = [token];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result);
    });
  });
}
function addNewMatchedPageMsg(msgObj) {
  return new Promise((resolve, reject) => {
    msgObj.content = msgObj.content.replace(/\n/g, '\r\n');
    const queryString = 'INSERT INTO messages SET ?';
    pool.query(queryString, msgObj, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result.insertId);
    });
  });
}
function getLastestMsg(matchedIdArr) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    if (matchedIdArr.length > 0) {
      for (let i = 0; i < matchedIdArr.length - 1; i++) {
        queryString +=
          `(SELECT * FROM messages m${i}
          WHERE m${i}.matched_id = ? 
          AND sender <> 4 
          ORDER BY create_time DESC 
          LIMIT 0,1 ) 
          UNION ALL `;
      }
      queryString +=
        `(SELECT * FROM messages m
        WHERE m.matched_id = ?
        AND sender <> 4 
        ORDER BY create_time DESC 
        LIMIT 0,1 ) `;
      pool.query(queryString, matchedIdArr, (err, result) => {
        if (err) { reject(err); return; }
        resolve(result);
      });
    } else {
      resolve([]);
    }
  });
}
function getConfirmedMatchMsg(matched_id) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT m.content, u.nickname sender, m.create_time 
    FROM messages m
    JOIN users u ON u.id = m.sender
    WHERE matched_id = ? 
    AND sender <> 4 
    ORDER BY create_time`;
    pool.query(string, [matched_id], (err, result) => {
      if (err) { reject(err); return; }
      let response = [];
      result.forEach(e => {
        e.create_time = moment(e.create_time).utc().zone(-8).format('lll');
        response.push(e);
      });
      resolve(response);
    });
  });
}
function getInsertedMsgTime(msgId) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT m.create_time 
    FROM messages m
    WHERE m.id = ?`;
    pool.query(string, [msgId], (err, result) => {
      if (err) { reject(err); return; }
      resolve(moment(result[0].create_time).utc().zone(-8).format('lll'));
    });
  });
}



function sendMsgToNoMatcher(msg) {
  return new Promise((resolve, reject) => {
    pool.query('INSERT INTO messages SET ?', [msg], (err, result) => {
      if (err) { reject(err); return; }
      resolve(result.affectedRows);
    });
  });
}
function insertNewMatchMsg(msgArr) {
  return new Promise((resolve, reject) => {
    let string = 'INSERT INTO messages (content, sender, receiver, mentioned_item_id, link) values ?';
    let condition = [];
    msgArr.forEach(msg => {
      msg.push('/want/check/');
      condition.push(msg);
    });
    pool.query(string, [condition], (err, result) => {
      if (err) { reject(err); return; }
      resolve(result.affectedRows);
    });
  });
}
function insertMatchedMsg(insertMsgQueryDataArr) {
  return new Promise((resolve, reject) => {
    let queryString = 'INSERT INTO messages(content, sender, receiver, mentioned_item_id, matched_id, link) VALUES ?';
    pool.query(queryString, [insertMsgQueryDataArr], (err, insertMsgResult) => {
      if (err) {
        reject(err);
      } else {
        resolve(insertMsgResult.affectedRows);
      }
    });
  });
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
  getInsertedMsgTime,
};