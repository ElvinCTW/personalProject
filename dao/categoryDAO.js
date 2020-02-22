const mysql = require('../util/mysql');
module.exports = {
  get: (queryData)=>{
    return new Promise((resolve, reject)=>{
      if (queryData.action === 'getSubCategory' || queryData.action === 'getMainCategory') {
        let queryString = '';
        let queryCondition = [];
        if (queryData.action === 'getSubCategory') {
          queryString = 'SELECT * FROM sub_main sm JOIN main_category m ON m.id = sm.main_id JOIN sub_category s ON s.id = sm.sub_id WHERE m.main_category = ? ORDER BY s.id DESC'
          queryCondition.push(queryData.main_category)
        } else if (queryData.action === 'getMainCategory') {
          queryString = 'SELECT * FROM main_category m ORDER BY m.id DESC'
        } else {
          console.log('no such requrest, categoryDAO')
        }
        mysql.pool.query(queryString, queryCondition, (err, listData, fileds) => {
          if (err) {
            mysql.errLog(err,'listData','categoryDAO')
            reject(err)
          } else {
            resolve(listData)
          }
        });
      }
    })
  }
}