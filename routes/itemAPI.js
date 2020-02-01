const express = require('express');
const router = express.Router();
const userDAO = require('../dao/user');
const itemDAO = require('../dao/item');

router.post('/add', async (req, res, next)=>{
  /** Input : req.body from add items page */
  /** To Do : get user data add item into db */
  // get user data
  let userID;
  if (req.body.token) {
    const userDataArr = await userDAO.get(req.body.token);
    userID = userDataArr[0].sign_id
  } else {
    userID = null
  }
  // insert item
  const insertItemResult = await itemDAO.insert({
    user_id: userID,
    main_category: req.body.main_category,
    sub_category: req.body.sub_category,
    tags: req.body.tags,
    title: req.body.title,
    status: req.body.status,
    count:  req.body.count,
    introduction: req.body.insert,
    pictures: req.body.pictures,
  })
  /** Output : success or error msg */
  if (insertItemResult.errorMsg) {
    res.status(500).send(insertItemResult.errorMsg)
  } else {
    res.status(200).send({
      insertStatus: 'success',
    })
  }
})

module.exports = router;