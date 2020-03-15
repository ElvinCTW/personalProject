require('dotenv').config();
const { NODE_ENV } = process.env;
const { tags, item_tags, main_sub_categories, users, want, items, main_categories, sub_categories, messages, matches, item_category } = require('./fake_data');
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
      pool.query(`TRUNCATE TABLE ${table}`, [], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  };

  return setForeignKey(0)
    .then(() => { return truncateTable('item_category'); })
    .then(() => { return truncateTable('want'); })
    .then(() => { return truncateTable('matches'); })
    .then(() => { return truncateTable('main_sub_categories'); })
    .then(() => { return truncateTable('items'); })
    .then(() => { return truncateTable('messages'); })
    .then(() => { return truncateTable('main_categories'); })
    .then(() => { return truncateTable('sub_categories'); })
    .then(() => { return truncateTable('users'); })
    .then(() => { return truncateTable('tags'); })
    .then(() => { return truncateTable('item_tags'); })
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
    .then(() => { return _createFakeTags(); })
    .then(() => { return _createFakeMainCategories(); })
    .then(() => { return _createFakeSubCategories(); })
    .then(() => { return _createFakeMessages(); }) 
    .then(() => { return _createFakeItems(); })
    .then(() => { return _createFakeMatches(); })
    .then(() => { return _createFakeWant(); })
    .then(() => { return _createFakeItemsTag(); })
    .then(() => { return _createFakeItemCategories(); })
    .then(() => { return _createFakeMainSubCategories(); })
    .catch(err => console.log(err));



  function _createFakeItemsTag() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO item_tags(item_id, tag_id) values ?', [item_tags.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeTags() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO tags(id, tag) values ?', [tags.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeMainSubCategories() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO main_sub_categories(main_category_id, sub_category_id) values ?', [main_sub_categories.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeItemCategories() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO item_category(main_category_id, sub_category_id, item_id) values ?', [item_category.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeMatches() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO matches(id, start_item_id, middle_item_id, end_item_id) values ?', [matches.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeMessages() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO messages(id, content, sender, time, watched, link, receiver, mentioned_item_id, matched_id) values ?', [messages.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeMainCategories() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO main_categories(id, main_category) values ?', [main_categories.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeSubCategories() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO sub_categories(id ,sub_category) values ?', [sub_categories.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeUser() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO users(id, sign_id, password, nickname, token, time, watch_msg_time) values ?', [users.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeItems() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO items(id, user_id, tags, title, status, introduction, pictures, time, availability, matched_id, matched_item_id) VALUES ?', [items.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }

  function _createFakeWant() {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO want(id, want_item_id, required_item_id, checked) VALUES ?', [want.map(obj => Object.values(obj))], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }).catch(err => console.log(err));
  }
}

async function closeCon() {
  return new Promise((resolve) => {
    pool.end();
    resolve();
  });
}

module.exports = {
  truncateFakeData,
  _createFakeData,
  closeCon,
};