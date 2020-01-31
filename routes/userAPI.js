const express = require('express');
const router = express.Router();
const userDAO = require('../dao/user');

router.post('/register', async (req, res, next)=>{
  /* Input : req.body from register page */
  /* To Do : check user exist && register users */
  // check no double account
  const checkUserResult = await userDAO.get(req.body.id);
  if (checkUserResult.length !== 0) {
    console.log(checkUserResult);
    console.log('double account, did not insert user.');
    res.status(500).send('double account, did not insert user.')
  } else {
    // register
    const insertUserResult = await userDAO.insert({
      sign_id: req.body.id,
      password: req.body.password,
      nickname: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
    });
    /* Output : Index page w/ user data || fail alert */
    res.status(200).send({user:{
      name:req.body.nickname,
    },});
  }
});

module.exports = router;
