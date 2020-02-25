const mysql = require('../util/mysql');
module.exports = {
  get: (queryData)=>{
    return new Promise((resolve, reject)=>{
      if (queryData.action === 'getBoardList') {
        let queryString = 
        `SELECT * FROM main_category`;
        mysql.advancedQuery({
          queryString: queryString,
          queryCondition: [],
          queryName: 'boardList',
          DAO_name: 'categoryDAO',
          reject: reject,
        },(boardList)=>{
          resolve(boardList)
        })
      } 
    })
  }
}