const mysql = require('../util/mysql');
module.exports = {
  insert: (queryData)=>{
    // let queryCondition = [];
    let queryString = '';
    return new Promise((resolve, reject) => {
      if (queryData.action === 'insertItemGoneMsgToUser') {
        queryString = 'INSERT INTO message(content, sender, receiver, mentioned_item_id, matched_id, time) VALUES ?';
        // queryCondition.length = 0;
        // queryCondition.push(queryData.insertMsgQueryDataArr);
        // console.log('queryCondition')
        // console.log(queryCondition)
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
      }
    })
  }
}