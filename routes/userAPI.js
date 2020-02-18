const express = require('express');
const router = express.Router();
const userDAO = require('../dao/user');

router.post('/register', async (req, res, next)=>{
  const checkUserResult = await userDAO.get(req.body.id);
  if (checkUserResult.length !== 0) {
    console.log('this');
    res.status(200).send('本ID已被註冊，請換一個ID再試一次')
  } else if (checkUserResult.length === 0){
    console.log('here');
    // register
    const insertUserResult = await userDAO.insert({
      sign_id: req.body.id,
      password: req.body.password,
      nickname: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      city: req.body.city,
    }).catch((err)=>{
      res.send('double')
    });
    /* Output : Index page w/ user data || fail alert */
    res.status(200).send({user: insertUserResult});
  } else {
    console.log('that');
    res.status(500).send('unknown error in registerAPI')
  }
});

router.post('/signin', async (req, res, next)=>{
  /* Input: req.body of ID && pwd */
  /* To Do : get user data from db and log user in */
  // Check if user exist
  const checkUserResult = await userDAO.get(req.body.id);
  if (checkUserResult.length === 0) {
    // console.log(checkUserResult);
    console.log('no such an user, does not sign in');
    res.status(200).send('查無此用戶，請修改資訊後再試一次');
  } else if (checkUserResult.length === 1) {
    // Sign in
    res.status(200).send({user: {
      nickname: checkUserResult[0].nickname,
      token: checkUserResult[0].token,
    }});
    // To do : Update token
  }
  /* Output : Index page w/ user data || fail alert */
})

module.exports = router;
