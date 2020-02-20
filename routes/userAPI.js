const express = require('express');
const router = express.Router();
const userDAO = require('../dao/user');

router.post('/register', async (req, res, next)=>{
  const checkUserResult = await userDAO.get(req.body);
  if (checkUserResult.length !== 0) {
    res.status(200).render('/',{
      errorMsg: '本ID已被註冊，請換一個ID再試一次'
    })
  } else if (checkUserResult.length === 0){
    console.log('註冊');
    // register
    const insertUserResult = await userDAO.insert({
      sign_id: req.body.id,
      password: req.body.password,
      nickname: req.body.name,
    }).catch((err)=>{
      res.send('double')
    });
    /* Output : Index page w/ user data || fail alert */
    res.render('user_success',{user: insertUserResult});
  } else {
    console.log('that');
    res.status(500).send('unknown error in registerAPI')
  }
});

router.post('/signin', async (req, res, next)=>{
  /* Input: req.body of ID && pwd */
  /* To Do : get user data from db and log user in */
  // Check if user exist
  const signinResult = await userDAO.get({
    action: 'sign-in',
    user: {
      id: req.body.id,
      password: req.body.password,
    },
  });
  let sendbackObj = {user: {}}
  sendbackObj.user.nickname = (typeof signinResult!=='undefined')?signinResult.nickname:'';
  sendbackObj.user.token = (typeof signinResult!=='undefined')?signinResult.token:'';
  res.render('sign_result', sendbackObj);
})

module.exports = router;
