/* eslint-disable require-jsdoc */
const {pool} = require('../util/mysql');
module.exports = {
  get: (queryData) => {
    return new Promise((resolve, reject) => {
      if (queryData.action === 'doNothing') {
        resolve({});
      } else if (queryData.action === 'getSubCategories' ||
      queryData.action === 'getMainCategories') {
        // let queryString = '';
        // const queryCondition = [];
        // let categoriesType;
        if (queryData.action === 'getSubCategories') {
          // categoriesType = 'subCategories';
          // queryString =
          //   `SELECT s.* FROM sub_categories s
          // JOIN main_sub_categories ms
          // ON s.id = ms.sub_category_id
          // WHERE ms.main_category_id = ?
          // ORDER BY s.id DESC`;
          queryCondition.push(queryData.main_category);
        } else if (queryData.action === 'getMainCategories') {
          // categoriesType = 'mainCategories';
          // queryString = 'SELECT * FROM main_categories m ORDER BY m.id DESC';
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
  getCategories,
  insertItemCategory,
};

function getCategories(query) {
  return new Promise((resolve, reject)=>{
    let string = '';
    const condition = [];
    let categoriesType;
    if (!query.main_category || !query.sub_category) { // '/'
      if (!query.main_category) {
      // 取得main_categories
        categoriesType = 'mainCategories';
        string = 'SELECT * FROM main_categories m ORDER BY m.id DESC';
      } else { // '/?main_category'
      // 取得sub_categories
        string =
        `SELECT s.* FROM sub_categories s
        JOIN main_sub_categories ms 
        ON s.id = ms.sub_category_id
        WHERE ms.main_category_id = ?
        ORDER BY s.id DESC`;
        condition.push(query.main_category);
        categoriesType = 'subCategories';
      }
      pool.query(string, condition, (err, listData) => {
        if (err) {
          reject(err);
        } else {
          const resObj = {listData};
          resObj[categoriesType] = categoriesType;
          resolve(resObj);
        }
      });
    } else {
      resolve({});
    }
  });
}

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
