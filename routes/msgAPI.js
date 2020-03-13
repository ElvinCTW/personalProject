const express = require('express');
const router = express.Router();
const {getMsgForHeader, markMsgAsWatched} = require('../dao/msgDAO');

router.post('/watched', async (req, res)=>{
  let token = req.headers.authorization.split(' ')[1]?
    req.headers.authorization.split(' ')[1]:null; 
  let id = req.query.id?req.query.id:null;
  await markMsgAsWatched(token,id)
    .catch(err=>console.log(err))
    .then(affectedRows=>res.send(`${affectedRows}`));
});

router.get('/header', async (req, res)=>{
  // get new notification from msgDAO
  let token = req.headers.authorization.split(' ')[1]?
    req.headers.authorization.split(' ')[1]:null; 
  if (token) {
    await getMsgForHeader(token)
      .catch(err=>{
        console.log(err);
        res.status(500).send([]);
      })
      .then(unreadMsgArr=>{res.send(unreadMsgArr);});
  } else {
    res.status(400).send();
  }
});

module.exports = router;