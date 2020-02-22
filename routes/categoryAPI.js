const express = require('express');
const router = express.Router();
const categoryDAO = require('../dao/categoryDAO');

router.get('/:type', async (req, res, next) => {
  // call DAO
  let obj = {};
  if (req.params.type === 'main') {
    obj.action = 'getMainCategory'
  } else if (req.params.type === 'sub') {
    obj.action = 'getSubCategory'
    obj.main_category = req.query.main_category
  }
  let categoryList = await categoryDAO.get(obj).catch(()=> {
    res.send(500).send({errorMsg:'get categoryList error'})
  })
  if (categoryList) {
    res.status(200).send(categoryList)
  }
})

module.exports = router;