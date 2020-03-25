require('dotenv').config();
module.exports = {
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_KEY,
  s3URL: 'https://triangletradeelvintokyo.s3-ap-northeast-1.amazonaws.com/',
};
