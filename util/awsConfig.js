require('dotenv').config()
module.exports = {
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_KEY,
}