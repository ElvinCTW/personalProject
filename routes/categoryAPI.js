const express = require('express');
const router = express.Router();
const categoryDAO = require('../dao/categoryDAO');

router.get('/boardList', async (req, res) => {
  let token = req.headers.authorization.split(' ')[1];
  let boardList = await categoryDAO.get({
    action: 'getBoardList',
    token: token,
  }).catch((err) => {
    console.log(err);
    res.status(500).send({ errorMsg: '資料庫暫時出錯，請再試一次QQ' });
  });
  if (boardList) {
    res.send(boardList);
  }
});

router.get('/item_insertion/:type', async (req, res) => {
  // call DAO
  let obj = {};
  if (req.params.type === 'main') {
    obj.action = 'getMainCategories';
  } else if (req.params.type === 'sub') {
    obj.action = 'getSubCategories';
    obj.main_category = req.query.main_category;
  }
  let resObj = await categoryDAO.get(obj).catch(() => {
    res.status(500).send({ errorMsg: 'get categoryList error' });
  });
  if (resObj) {
    res.status(200).send(resObj.listData);
  }
});

module.exports = router;