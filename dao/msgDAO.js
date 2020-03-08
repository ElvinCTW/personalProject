const mysql = require('../util/mysql');

function markMsgAsWatched(token,id) {
  return new Promise((resolve, reject) => {
    let queryString =
      `UPDATE message m 
      JOIN users u ON u.id = m.receiver 
      SET m.watched = "true" 
      WHERE u.token = ? 
      AND m.watched = "false" 
      AND m.id = ?`;
    let queryCondition = [token, id]
    mysql.pool.query(queryString, queryCondition, (err, markedAsWatchedResult, fileds) => {
      if (err) {
        console.log('err here');
        mysql.errLog(err, 'markedAsWatchedResult', 'msgDAO')
        reject(err)
      } else {
        resolve(markedAsWatchedResult.affectedRows)
      }
    });
  })
}
function getMsgForHeader(token) {
  return new Promise((resolve, reject) => {
    let queryString =
      `SELECT m.* FROM message m 
      JOIN users u ON u.id = m.receiver 
      WHERE u.token = ? 
      ORDER BY m.time DESC
      LIMIT 0,5`;
    mysql.advancedQuery({
      queryString: queryString,
      queryCondition: [token],
      queryName: 'headerMsg',
      DAO_name: 'msgDAO',
      reject: reject,
    }, (headerMsg) => {
      resolve(headerMsg)
    })
  })
}
function addNewMatchedPageMsg(msgObj) {
  return new Promise((resolve, reject) => {
    let queryString = '';
    msgObj.content = msgObj.content.replace(/\n/g, '\r\n')
    queryString = 'INSERT INTO message SET ?';
    mysql.pool.query(queryString, msgObj, (err, result, fileds) => {
      if (err) {
        mysql.errLog(err, 'addNewMatchedPageMsg', 'msgDAO')
        reject(err)
      } else {
        resolve(result.affectedRows)
      }
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
        WHERE m.matched_id = ? 
        AND sender <> "system" 
        ORDER BY time DESC 
        LIMIT 0,1 ) `
      mysql.advancedQuery({
        queryString: queryString,
        queryCondition: matchedIdArr,
        queryName: 'lastestMsgArr',
        DAO_name: 'msgDAO',
        reject: reject,
      }, (lastestMsgArr) => {
        resolve(lastestMsgArr)
      })
    } else {
      resolve([])
    }
  })
}
function getConfirmedMatchMsg(matched_id) {
  return new Promise((resolve, reject) => {
    let queryString =
      `SELECT content, sender, time 
  FROM message 
  WHERE matched_id = ? 
  AND sender <> "system" 
  ORDER BY time`;
    // console.log('queryData.matched_id')
    // console.log(queryData.matched_id)
    mysql.advancedQuery({
      queryString: queryString,
      queryCondition: [matched_id],
      queryName: 'confirmedMatchMsg',
      DAO_name: 'msgDAO',
      reject: reject,
    }, (confirmedMatchMsg) => {
      // console.log('confirmedMatchMsg')
      // console.log(confirmedMatchMsg)
      resolve(confirmedMatchMsg)
    })
  })
}
function sendMsgToNoMatcher(msg) {
  return new Promise((resolve, reject) => {
    mysql.pool.query(`INSERT INTO message SET ?`, [msg], (err, result, fileds) => {
      if (err) {
        let functionName = arguments.callee.toString();
        functionName = functionName.substr('function '.length);
        functionName = functionName.substr(0, functionName.indexOf('('));
        mysql.errLog(err, functionName, __filename)
        reject(err)
      } else {
        resolve(result)
      }
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
    mysql.pool.query(string, [condition], (err, result, fileds) => {
      if (err) {
        let functionName = arguments.callee.toString();
        functionName = functionName.substr('function '.length);
        functionName = functionName.substr(0, functionName.indexOf('('));
        mysql.errLog(err, functionName, __filename)
        reject(err)
      } else {
        resolve(result)
      }
    });
  })
}
function insertMatchedMsg(insertMsgQueryDataArr) {
  return new Promise((resolve, reject) => {
    let queryString = 'INSERT INTO message(content, sender, receiver, mentioned_item_id, matched_id, time, type) VALUES ?';
    mysql.pool.query(queryString, [insertMsgQueryDataArr], (err, insertMsgResult, fileds) => {
      if (err) {
        mysql.errLog(err, 'insertMsgResult', 'msgDAO')
        reject(err)
      } else {
        console.log('insert')
        console.log(insert)
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