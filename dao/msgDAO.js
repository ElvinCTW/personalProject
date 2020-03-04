const mysql = require('../util/mysql');
module.exports = {
  insert: (queryData)=>{
    let queryString = '';
    return new Promise((resolve, reject) => {
      if (queryData.action === 'insertMsgToOtherUserWhenNoMatch') {
        insertMsgToOtherUserWhenNoMatch(queryData.msg, (output)=>{
          if (output.result) {
            resolve(output.result.affectedRows)
          } else {
            reject(output.err)
          }
        })
      } else if (queryData.insertMsgQueryDataArr) {
        queryString = 'INSERT INTO message(content, sender, receiver, mentioned_item_id, matched_id, time, type) VALUES ?';
        mysql.pool.query(queryString, [queryData.insertMsgQueryDataArr], (err, insertMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'insertMsgResult','msgDAO')
            reject(err)
          } else {
            // console.log('insertMsgResult')
            // console.log(insertMsgResult)
            resolve(insertMsgResult.affectedRows)
          }
        });
      } else if (queryData.action === 'addNewMatchedPageMsg') {
        // console.log('queryData')
        // console.log(queryData)
        console.log('msgDAO,inserting');
        queryData.data.content = queryData.data.content.replace(/\n/g, '\r\n')
        console.log('queryData')
        console.log(queryData)
        queryString = 'INSERT INTO message SET ?';
        // queryCondition.length = 0;
        // delete queryData['action'];
        // console.log('queryData')
        // console.log(queryData)
        // let queryCondition=queryData.data
        // queryCondition.push(Object.values(queryData));
        mysql.pool.query(queryString, queryData.data, (err, insertNewMatchedPageMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'insertNewMatchedPageMsgResult','msgDAO')
            reject(err)
          } else {
            // console.log('insertNewMatchedPageMsgResult.affectedRows')
            // console.log(insertNewMatchedPageMsgResult.affectedRows)
            resolve(insertNewMatchedPageMsgResult.affectedRows)
          }
        });
      } else if (queryData.action === 'insertNewMatchMsg') {
        insertNewMatchMsg(queryData.msgArr,(output)=>{
          if (output.result) {
            resolve(output.result.affectedRows)
          } else {
            reject(output.err)
          }
        })
      }
    })
  },
  get: (queryData)=>{
    return new Promise((resolve, reject) => {
      if (queryData.action === 'getLastestMsg') {
        let queryString = '';
        if (queryData.matchedIdArr.length>0) {
          for (let i=0;i<queryData.matchedIdArr.length-1;i++) {
            queryString+=
            `(SELECT * FROM message m${i}
              WHERE m${i}.matched_id = ? 
              AND sender <> "system" 
              ORDER BY time DESC 
              LIMIT 0,1 ) 
              UNION ALL `
          }
          queryString+=
          `(SELECT * FROM message m
            WHERE m.matched_id = ? 
            AND sender <> "system" 
            ORDER BY time DESC 
            LIMIT 0,1 ) `
          mysql.advancedQuery({
            queryString: queryString,
            queryCondition: queryData.matchedIdArr,
            queryName: 'lastestMsgArr',
            DAO_name: 'msgDAO',
            reject: reject,
          },(lastestMsgArr)=>{
            resolve(lastestMsgArr)
          })
        } else {
          resolve([])
        }
      } else if (queryData.action === 'getConfirmedMatchMsg') {
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
          queryCondition: [queryData.matched_id],
          queryName: 'confirmedMatchMsg',
          DAO_name: 'msgDAO',
          reject: reject,
        },(confirmedMatchMsg)=>{  
          // console.log('confirmedMatchMsg')
          // console.log(confirmedMatchMsg)
          resolve(confirmedMatchMsg)
        })
      } else if (queryData.action === 'getMsgForHeader') {
        let queryString = 
        `SELECT m.* FROM message m 
        JOIN users u ON u.id = m.receiver 
        WHERE u.token = ? 
        ORDER BY m.time DESC`;
        mysql.advancedQuery({
          queryString: queryString,
          queryCondition: [queryData.token],
          queryName: 'headerMsg',
          DAO_name: 'msgDAO',
          reject: reject,
        },(headerMsg)=>{
          resolve(headerMsg)
        })
      }
    })
  },
  update: (queryData)=>{
    return new Promise((resolve, reject) => {
      let queryString='';
      let queryCondition =[];
      if (queryData.action === 'markedAsWatched') {
        queryString = 'UPDATE message m JOIN users u ON u.id = m.receiver SET m.watched = "true" WHERE u.token = ? AND m.watched = "false" AND m.id = ?';
        queryCondition.length = 0;
        queryCondition.push(queryData.token, queryData.id);
        mysql.pool.query(queryString, queryCondition, (err, markedAsWatchedResult, fileds) => {
          if (err) {
            console.log('err here');
            mysql.errLog(err,'markedAsWatchedResult','msgDAO')
            reject(err)
          } else {
            resolve(markedAsWatchedResult.affectedRows)
          }
        });
      }
    })  
  }
}

function insertMsgToOtherUserWhenNoMatch(msg, cb) {
  let string = `INSERT INTO message SET ?`;
  let condition = [msg];
  mysql.pool.query(string, condition, (err, result, fileds) => {
    if (err) {
      let functionName = arguments.callee.toString();
      functionName = functionName.substr('function '.length);
      functionName = functionName.substr(0, functionName.indexOf('('));
      mysql.errLog(err, functionName, __filename)
      cb({err})
    } else {
      cb({result})
    }
  });
}

function insertNewMatchMsg(msgArr, cb) {
  let string = 'INSERT INTO message (content, sender, receiver, time, mentioned_item_id, type) values ?';
  let condition = [];
  msgArr.forEach(msg=>{
    msg.push('/want/check/')
    condition.push(msg)
  })
  mysql.pool.query(string, [condition], (err, result, fileds) => {
    if (err) {
      let functionName = arguments.callee.toString();
      functionName = functionName.substr('function '.length);
      functionName = functionName.substr(0, functionName.indexOf('('));
      mysql.errLog(err, functionName, __filename)
      cb({err})
    } else {
      cb({result})
    }
  });
}