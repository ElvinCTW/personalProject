const mysql = require('mysql');
require('dotenv').config()
module.exports = {
  pool: mysql.createPool({
    connectionLimit : 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: 'triangle_trade'
  }),
}