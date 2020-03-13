const {pool} = require('../util/mysql');
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
          categoriesType = 'subCategories';
          queryString = 
          `SELECT s.* FROM sub_main sm 
          JOIN main_categories m 
          ON m.id = sm.main_id 
          JOIN sub_categories s 
          ON s.id = sm.sub_id 
          WHERE m.id = ? 
          ORDER BY s.id DESC`;
          queryCondition.push(queryData.main_category);
          console.log('queryCondition');
          console.log(queryCondition);
        } else if (queryData.action === 'getMainCategories') {
          categoriesType = 'mainCategories';
          queryString = 'SELECT * FROM main_categories m ORDER BY m.id DESC';
        } else {
          console.log('no such requrest, categoryDAO');
        }
        pool.query(queryString, queryCondition, (err, listData) => {
          if (err) {
            reject(err);
          } else {
            let resObj = {listData};
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
  return new Promise((resolve,reject)=>{
    const string = 
    'INSERT INTO item_categories SET ?';
    const condition = [data];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); return; }
      resolve(result.affectedRows);
    });
  });
}