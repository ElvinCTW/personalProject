require('dotenv').config();
const {NODE_ENV} = process.env;
const { users, want, items } = require('./fake_data');
const { pool } = require('../util/mysql');

/**
 * 刪除舊資料
 */
async function truncateFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }
  console.log('truncate fake data');

  const setForeignKey = (status) => {
    return new Promise((resolve, reject) => {
      pool.query('SET FOREIGN_KEY_CHECKS = ?', status, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  };

  const truncateTable = (table) => {
    return new Promise((resolve, reject) => {
      pool.query(`TRUNCATE TABLE ${table}`,[], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  };

  return setForeignKey(0)
    .then(() => { return truncateTable('items'); })
    .then(() => { return truncateTable('main_category'); })
    .then(() => { return truncateTable('matched'); })
    .then(() => { return truncateTable('message'); })
    .then(() => { return truncateTable('sub_category'); })
    .then(() => { return truncateTable('sub_main'); })
    .then(() => { return truncateTable('users'); })
    .then(() => { return truncateTable('want'); })
    .then(() => { return setForeignKey(1); })
    .catch(err => console.log(err));
}

/**
 * 插入新資料
 */
async function _createFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }
  console.log('create fake data');
  return _createFakeUser()
    .then(()=>{ return _createFakeItems();})
    .then(()=>{ return _createFakeWant();})
    .catch(err=>console.log(err));

  function _createFakeUser() {
    return new Promise((resolve,reject)=>{
      pool.query('INSERT INTO users(sign_id, password, nickname, token, time, watch_msg_time) values ?', [users.map(obj=>Object.values(obj))], (err)=>{
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err=>console.log(err));
  }

  function _createFakeItems() {
    return new Promise((resolve,reject)=>{
      pool.query('INSERT INTO items(user_id, main_category, sub_category, tags, title, status, introduction, pictures, time, availability, matched_id, matched_item_id) VALUES ?', [items.map(obj=>Object.values(obj))], (err)=>{
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err=>console.log(err));
  }

  function _createFakeWant() {
    return new Promise((resolve,reject)=>{
      pool.query('INSERT INTO want(want_item_id, required_item_id, matched, checked) VALUES ?', [want.map(obj=>Object.values(obj))], (err)=>{
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err=>console.log(err));
  }
}

async function closeCon() {
  return new Promise((resolve)=>{
    pool.end();
    resolve();
  });
}

module.exports = {
  truncateFakeData,
  _createFakeData,
  closeCon,
};