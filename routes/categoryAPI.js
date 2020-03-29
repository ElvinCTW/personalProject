/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const {getItemType} = require('../controller/category');

// router.get('/boardList', async (req, res) => {
//   const token = req.headers.authorization.split(' ')[1];
//   const boardList = await category.get({
//     action: 'getBoardList',
//     token: token,
//   }).catch((err) => {
//     console.log(err);
//     res.status(500).send({errorMsg: '資料庫暫時出錯，請再試一次QQ'});
//   });
//   if (boardList) {
//     res.send(boardList);
//   }
// });

router.get('/item-insertion/:type', getItemType);

module.exports = router;
