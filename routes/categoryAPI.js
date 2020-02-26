const express = require('express');
const router = express.Router();
const categoryDAO = require('../dao/categoryDAO');



router.get('/boardList', async (req, res, next) => {
  let token = req.headers.authorization.split(' ')[1];
  let boardList = await categoryDAO.get({
    action:'getBoardList',
    token:token,
  }).catch((err)=>{
    res.status(500).send({errorMsg:'資料庫暫時出錯，請再試一次QQ'})
  })
  if (boardList) {
    res.send(boardList);
  }
})

router.get('/item_insertion/:type', async (req, res, next) => {
  // call DAO
  let obj = {};
  if (req.params.type === 'main') {
    obj.action = 'getMainCategory'
  } else if (req.params.type === 'sub') {
    obj.action = 'getSubCategory'
    obj.main_category = req.query.main_category
  }
  let categoryList = await categoryDAO.get(obj).catch(()=> {
    res.status(500).send({errorMsg:'get categoryList error'})
  })
  if (categoryList) {
    res.status(200).send(categoryList)
  }
})

module.exports = router;