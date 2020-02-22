const mysql = require('mysql');
require('dotenv').config()
module.exports = {
  pool: mysql.createPool({
    connectionLimit : 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: 3306,
    database: 'triangle_trade'
  }),
  errLog: (err, promise, DAO)=>{
    console.log(`error in ${promise}, ${DAO}`);
    console.log(err.sqlMessage);
    console.log(err.sql);
  },
  itemJoinString: `SELECT i.*, 
  CASE WHEN i.user_id > 0 THEN u.nickname else 0 END as user_nickname,
  CASE WHEN i.main_category > 0 THEN m.main_category else 0 END as main_category_text,
  CASE WHEN i.sub_category > 0 THEN s.sub_category else 0 END as sub_category_text
  FROM triangle_trade.items i 
  JOIN main_category m on m.id = i.main_category 
  JOIN sub_category s on s.id = i.sub_category
  JOIN users u on u.id = i.user_id `,
}