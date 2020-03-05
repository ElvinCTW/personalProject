const mysql = require('mysql');
require('dotenv').config()

pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: 3142,
  database: 'triangle_trade'
})

const itemJoinString = 
  `SELECT i.*, 
  u.nickname user_nickname,
  u.id user_id,
  m.main_category main_category_text,
  s.sub_category sub_category_text
  FROM triangle_trade.items i 
  JOIN main_category m on m.id = i.main_category 
  JOIN sub_category s on s.id = i.sub_category
  JOIN users u on u.id = i.user_id `

function errLog(err, functionName, fileName) {
  console.log(`-------------ERROR START-------------`)
  console.log(`error in ${functionName}, ${fileName}`);
  console.log(err.sqlMessage);
  console.log(err.sql);
  console.log(`--------------ERROR END--------------`)
}

function advancedQuery(obj, cb) {
  pool.query(obj.queryString, obj.queryCondition, (err, result, fileds) => {
    if (err) {
      console.log(`error in ${obj.queryName}, ${obj.DAO_name}`);
      console.log(err.sqlMessage);
      console.log(err.sql);
      obj.reject(err)
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
}