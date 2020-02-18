const express = require('express');
const router = express.Router();
const msgDAO = require('../dao/msgDAO');

router.post('/new', async (req, res, next)=>{
  // console.log('req.body')
  // console.log(req.body)
  let affectedRows = await msgDAO.insert(req.body);
  if (affectedRows !== 1) {
    console.log('msgAPI did not insert msg correctly');
    res.status(400).send({errorMsg:'很抱歉，系統沒有成功儲存您的對話，若持續發生，請聯繫我們'})
  } else {
    res.status(200).send({msg:'成功送出訊息'})
  }
})

router.post('/watched', async (req, res, next)=>{
  let affectedRows = await msgDAO.update({
    action: 'markedAsWatched',
    nickname: req.query.nickname,
  })
  res.send(`${affectedRows}`);
})

router.get('/header', async (req, res, next)=>{
  // get new notification from msgDAO
  let unreadMsgArr = await msgDAO.get({
    action: 'getMsgForHeader',
    nickname: req.query.nickname,
  })
  res.send(unreadMsgArr);
})

module.exports = router;