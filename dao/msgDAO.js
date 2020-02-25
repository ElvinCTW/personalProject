const mysql = require('../util/mysql');
module.exports = {
  insert: (queryData)=>{
    let queryCondition = [];
    let queryString = '';
    return new Promise((resolve, reject) => {
      if (queryData.action === 'insertMsgToOtherUserWhenNoMatch') {
        let queryString = 
        `INSERT INTO message SET ?`;
        mysql.advancedQuery({
          queryString: queryString,
          queryCondition: [queryData.curUser, queryData],
          queryName: 'msgToOtherNonMatchUser',
          DAO_name: 'msgDAO',
          reject: reject,
        },(msgToOtherNonMatchUser)=>{
          resolve(msgToOtherNonMatchUser)
        })
      } else if (queryData.action === 'insertItemGoneMsgToUser') {
        queryString = 'INSERT INTO message(content, sender, receiver, mentioned_item_id, matched_id, time) VALUES ?';
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
        queryString = 'INSERT INTO message (content, sender, time, matched_id) values (?)';
        queryCondition.length = 0;
        delete queryData['action'];
        // console.log('queryData')
        // console.log(queryData)
        queryCondition.push(Object.values(queryData));
        mysql.pool.query(queryString, queryCondition, (err, insertNewMatchedPageMsgResult, fileds) => {
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
        // console.log('queryData')
        // console.log(queryData)
        queryString = 'INSERT INTO message (content, sender, receiver, time, mentioned_item_id) values ?';
        queryCondition.length = 0;
        queryCondition.push(queryData.msgArr);
        mysql.pool.query(queryString, queryCondition, (err, insertNewMatchedPageMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'insertNewMatchedPageMsgResult','msgDAO')
            reject(err)
          } else {
            // console.log('insertNewMatchedPageMsgResult.affectedRows')
            // console.log(insertNewMatchedPageMsgResult.affectedRows)
            resolve(insertNewMatchedPageMsgResult.affectedRows)
          }
        });
      }
    })
  },
  get: (queryData)=>{
    return new Promise((resolve, reject) => {
      if (queryData.action === 'getConfirmedMatchMsg') {
        let queryString = 
        `SELECT content, sender, time 
        FROM message 
        WHERE matched_id = ? 
        AND sender <> "system" 
        ORDER BY time`;
        mysql.advancedQuery({
          queryString: queryString,
          queryCondition: [queryData.matched_id],
          queryName: 'confirmedMatchMsg',
          DAO_name: 'msgDAO',
          reject: reject,
        },(confirmedMatchMsg)=>{  
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
        queryString = 'UPDATE message m JOIN users u ON u.id = m.receiver SET m.watched = "true" WHERE u.token = ? AND m.watched = "false"';
        queryCondition.length = 0;
        queryCondition.push(queryData.token);
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