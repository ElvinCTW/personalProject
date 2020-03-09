// const app = require('../app')
const {NODE_ENV} = process.env;
const {truncateFakeData, _createFakeData} = require('./fake_data_generator');
const {pool} = require('../util/mysql');

const setup = async ()=>{
  if (NODE_ENV !== 'test') {
    throw 'Not in test env';
  }
  return truncateFakeData()
    .then(()=>{ return _createFakeData();})
    .catch((err)=>{console.log(err);});
};

async function checkFakeData() {
  await getAllUsers();
  await getAllWant();
  await getAllItems();
  return;
}

function getAllWant() {
  return new Promise((resolve,reject)=>{
    let string = 'SELECT * FROM want';
    let condition = [];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.log(` Count of want : ${result.length}`);
        resolve();
      }
    });
  });
}

function getAllItems() {
  return new Promise((resolve,reject)=>{
    let string = 'SELECT * FROM items';
    let condition = [];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.log(` Count of items : ${result.length}`);
        resolve();
      }
    });
  });
}

function getAllUsers() {
  return new Promise((resolve,reject)=>{
    let string = 'SELECT * FROM users';
    let condition = [];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.log(` Count of users : ${result.length}`);
        resolve();
      }
    });
  });
}

module.exports = async ()=>{
  await setup(); 
  await checkFakeData();
  return null;
};