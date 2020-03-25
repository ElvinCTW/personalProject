/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const category = require('../model/category');

router.get('/boardList', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const boardList = await category.get({
    action: 'getBoardList',
    token: token,
  }).catch((err) => {
    console.log(err);
    res.status(500).send({errorMsg: '資料庫暫時出錯，請再試一次QQ'});
  });
  if (boardList) {
    res.send(boardList);
  }
});

router.get('/item_insertion/:type', async (req, res) => {
  const obj = {};
  if (req.params.type === 'main') {
    obj.action = 'getMainCategories';
  } else if (req.params.type === 'sub') {
    obj.action = 'getSubCategories';
    obj.main_category = req.query.main_category;
  }
  const resObj = await category.get(obj).catch(() => {
    res.status(500).send({errorMsg: 'get categoryList error'});
  });
  if (resObj) {
    res.status(200).send(resObj.listData);
  }
});

module.exports = router;
