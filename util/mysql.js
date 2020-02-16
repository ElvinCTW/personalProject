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
}