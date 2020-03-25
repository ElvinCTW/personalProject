/* eslint-disable require-jsdoc */
const {pool} = require('../util/mysql');
module.exports = {
  get: (queryData) => {
    return new Promise((resolve, reject) => {
      if (queryData.action === 'doNothing') {
        resolve({});
      } else if (queryData.action === 'getSubCategories' ||
      queryData.action === 'getMainCategories') {
        let queryString = '';
        const queryCondition = [];
        let categoriesType;
        if (queryData.action === 'getSubCategories') {
          categoriesType = 'subCategories';
          queryString =
            `SELECT s.* FROM sub_categories s 
          JOIN main_sub_categories ms 
          ON s.id = ms.sub_category_id 
          WHERE ms.main_category_id = ?  
          ORDER BY s.id DESC`;
          queryCondition.push(queryData.main_category);
        } else if (queryData.action === 'getMainCategories') {
          categoriesType = 'mainCategories';
          queryString = 'SELECT * FROM main_categories m ORDER BY m.id DESC';
        } else {
          console.log('no such requrest');
        }
        pool.query(queryString, queryCondition, (err, listData) => {
          if (err) {
            reject(err);
          } else {
            const resObj = {listData};
            resObj[categoriesType] = categoriesType;
            resolve(resObj);
          }
        });
      }
    });
  },
  insertItemCategory,
};

function insertItemCategory(data) {
  return new Promise((resolve, reject) => {
    const string =
      'INSERT INTO item_category SET ?';
    const condition = [data];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows);
      }
    });
  });
}
