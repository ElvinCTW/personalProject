const {NODE_ENV} = process.env;
const {truncateFakeData, closeCon} = require('./fake_data_generator');

const cleanData =  async ()=>{
  if (NODE_ENV !== 'test') {
    throw 'Not in test env';
  }
  return truncateFakeData()
    .catch((err)=>{console.log(err);})
}

module.exports = async () =>{
  // await cleanData();
  await closeCon();
  return null;
}