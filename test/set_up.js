/* eslint-disable require-jsdoc */
const {NODE_ENV} = process.env;
const {truncateFakeData, _createFakeData} = require('./fake_data_generator');
const {pool} = require('../util/mysql');

const setup = async () => {
  if (NODE_ENV !== 'test') {
    throw new Error('Not in test env');
  }
  return truncateFakeData()
      .then(() => {
        return _createFakeData();
      })
      .catch((err) => {
        console.log(err);
      });
};

async function checkFakeData() {
  await checkTable('want');
  await checkTable('users');
  await checkTable('items');
  await checkTable('main_categories');
  await checkTable('sub_categories');
  await checkTable('messages');
  await checkTable('matches');
  await checkTable('item_category');
  await checkTable('main_sub_categories');
  await checkTable('tags');
  await checkTable('item_tags');
  return;
}

function checkTable(table) {
  return new Promise((resolve, reject) => {
    const string = `SELECT * FROM ${table}`;
    const condition = [];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Count of ${table} : ${result.length}`);
        resolve();
      }
    });
  });
}

module.exports = async () => {
  await setup();
  await checkFakeData();
  return null;
};
