const mysql = require('../util/mysql');
module.exports = {
  get: (queryData) => {
    return new Promise((resolve, reject) => {
      if (queryData.action === 'doNothing') {
        resolve({});
      } else if (queryData.action === 'getSubCategories' || queryData.action === 'getMainCategories') {
        let queryString = '';
        let queryCondition = [];
        let categoriesType;
        if (queryData.action === 'getSubCategories') {
          categoriesType = 'subCategories'
          queryString = 
          `SELECT s.* FROM sub_main sm 
          JOIN main_category m 
          ON m.id = sm.main_id 
          JOIN sub_category s 
          ON s.id = sm.sub_id 
          WHERE m.id = ? 
          ORDER BY s.id DESC`
          queryCondition.push(queryData.main_category)
          console.log('queryCondition')
          console.log(queryCondition)
        } else if (queryData.action === 'getMainCategories') {
          categoriesType = 'mainCategories'
          queryString = 'SELECT * FROM main_category m ORDER BY m.id DESC';
        } else {
          console.log('no such requrest, categoryDAO')
        }
        mysql.pool.query(queryString, queryCondition, (err, listData, fileds) => {
          if (err) {
            mysql.errLog(err, 'listData', 'categoryDAO')
            reject(err)
          } else {
            let resObj = {
              listData:listData,
            }
            resObj[categoriesType] = categoriesType;
            resolve(resObj)
          }
        });
      }
    })
  }
}