const mysql = require('../util/mysql');
module.exports = {
  get: (queryData)=>{
    return new Promise((resolve, reject)=>{
      let queryString = '';
      let queryCondition = [];
      if (queryData.action === 'getSubCategory') {
        queryString = 'SELECT s.sub_category FROM sub_main sm JOIN main_category m ON m.id = sm.main_id JOIN sub_category s ON s.id = sm.sub_id WHERE m.main_category = ? ORDER BY s.id DESC'
        queryCondition.push(queryData.main_category)
      } else if (queryData.action === 'getMainCategory') {
        queryString = 'SELECT main_category FROM main_category m ORDER BY m.id DESC'
      } else {
        console.log('no such requrest, categoryDAO')
      }
      mysql.pool.query(queryString, queryCondition, (err, listData, fileds) => {
        if (err) {
          mysql.errLog(err,'listData','categoryDAO')
          reject(err)
        } else {
          console.log('listData')
          console.log(listData)
          resolve(listData)
        }
      });
    })
  }
}