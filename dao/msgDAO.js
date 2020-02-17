const mysql = require('../util/mysql');
module.exports = {
  insert: (queryData)=>{
    let queryCondition = [];
    let queryString = '';
    return new Promise((resolve, reject) => {
      if (queryData.action === 'insertItemGoneMsgToUser') {
        queryString = 'INSERT INTO message(content, sender, receiver, mentioned_item_id, matched_id, time) VALUES ?';
        mysql.pool.query(queryString, [queryData.insertMsgQueryDataArr], (err, insertMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'insertMsgResult','msgDAO')
            reject(err)
          } else {
            console.log('insertMsgResult')
            console.log(insertMsgResult)
            resolve(insertMsgResult.affectedRows)
          }
        });
      } else if (queryData.action === 'addNewMatchedPageMsg') {
        console.log('queryData')
        console.log(queryData)
        queryString = 'INSERT INTO message (content, sender, time, matched_id) values (?)';
        queryCondition.length = 0;
        delete queryData['action'];
        console.log('queryData')
        console.log(queryData)
        queryCondition.push(Object.values(queryData));
        mysql.pool.query(queryString, queryCondition, (err, insertNewMatchedPageMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'insertNewMatchedPageMsgResult','msgDAO')
            reject(err)
          } else {
            console.log('insertNewMatchedPageMsgResult.affectedRows')
            console.log(insertNewMatchedPageMsgResult.affectedRows)
            resolve(insertNewMatchedPageMsgResult.affectedRows)
          }
        });
      } else if (queryData.action === 'insertNewMatchMsg') {
        console.log('queryData')
        console.log(queryData)
        queryString = 'INSERT INTO message (content, sender, receiver, time, mentioned_item_id) values ?';
        queryCondition.length = 0;
        queryCondition.push(queryData.msgArr);
        mysql.pool.query(queryString, queryCondition, (err, insertNewMatchedPageMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'insertNewMatchedPageMsgResult','msgDAO')
            reject(err)
          } else {
            console.log('insertNewMatchedPageMsgResult.affectedRows')
            console.log(insertNewMatchedPageMsgResult.affectedRows)
            resolve(insertNewMatchedPageMsgResult.affectedRows)
          }
        });
      }
    })
  },
  get: (queryData)=>{
    return new Promise((resolve, reject) => {
      let queryString='';
      let queryCondition =[];
      if (queryData.action === 'getConfirmedMatchMsg') {
        queryString = 'SELECT content, sender, time FROM message WHERE matched_id = ? AND sender <> "system" ORDER BY time';
        queryCondition.length = 0;
        queryCondition.push(queryData.matched_id);
        mysql.pool.query(queryString, queryCondition, (err, getConfirmedMatchMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'getConfirmedMatchMsgResult','msgDAO')
            reject(err)
          } else {
            console.log('getConfirmedMatchMsgResult')
            console.log(getConfirmedMatchMsgResult)
            resolve(getConfirmedMatchMsgResult)
          }
        });
      } else if (queryData.action === 'getMsgForHeader') {
        queryString = 'SELECT * FROM message WHERE receiver = ? AND watched = "false"';
        queryCondition.length = 0;
        queryCondition.push(queryData.nickname);
        console.log('queryData.nickname')
        console.log(queryData.nickname)
        console.log('queryCondition')
        console.log(queryCondition)
        mysql.pool.query(queryString, queryCondition, (err, getMsgResult, fileds) => {
          if (err) {
            mysql.errLog(err,'getMsgResult','msgDAO')
            reject(err)
          } else {
            console.log('getMsgResult')
            console.log(getMsgResult)
            resolve(getMsgResult)
          }
        });
      }
    })
  },
  update: (queryData)=>{
    return new Promise((resolve, reject) => {
      let queryString='';
      let queryCondition =[];
      if (queryData.action === 'markedAsWatched') {
        queryString = 'UPDATE message SET watched = "true" WHERE receiver = ? AND watched = "false"';
        queryCondition.length = 0;
        queryCondition.push(queryData.nickname);
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