const mysql = require('mysql');
require('dotenv').config();

const host = process.env.NODE_ENV==='test' ? process.env.TEST_DB_HOST:process.env.DB_HOST;
const user = process.env.NODE_ENV==='test' ? process.env.TEST_DB_USER:process.env.DB_USER;
const password = process.env.NODE_ENV==='test' ? process.env.TEST_DB_PASS:process.env.DB_PASS;
const port = process.env.NODE_ENV==='test' ? process.env.TEST_DB_PORT:process.env.DB_PORT;
const database = process.env.NODE_ENV==='test' ? process.env.TEST_DB_DATABASE:process.env.DB_DATABASE;

const pool = mysql.createPool({
  connectionLimit: 10,
  host,
  user,
  password,
  port,
  database,
});
const itemJoinString = 
  `SELECT i.*, 
  u.nickname user_nickname,
  u.id user_id,
  mc.main_category main_category_text,
  sc.sub_category sub_category_text
  FROM items i 
  JOIN items_category ic ON i.id = ic.item_id
  JOIN main_categories mc ON mc.id = ic.main_category_id
  JOIN sub_categories sc ON sc.id = ic.sub_category_id
  JOIN users u on u.id = i.user_id `;

function errLog(err, functionName, fileName) {
  console.log('-------------ERROR START-------------');
  console.log(`error in ${functionName}, ${fileName}`);
  console.log(err.sqlMessage);
  console.log(err.sql);
  console.log('--------------ERROR END--------------');
}

function advancedQuery(obj, cb) {
  pool.query(obj.queryString, obj.queryCondition, (err, result) => {
    if (err) {
      obj.reject(err);
    } else {
      cb(result);
    }
  });
}

module.exports = {
  pool,
  errLog,
  itemJoinString,
  advancedQuery,
};