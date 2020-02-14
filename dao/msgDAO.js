const mysql = require('../util/mysql');
module.exports = {
  insert: (queryData)=>{
    // let queryCondition = [];
    let queryString = '';
    return new Promise((resolve, reject) => {
      if (queryData.action === 'insertItemGoneMsgToUser') {
        queryString = 'INSERT INTO message(content, sender, receiver, mentioned_item_id, time) VALUES ?';
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
  }
}