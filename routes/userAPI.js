const express = require('express');
const router = express.Router();
const userDAO = require('../dao/user');
// remember to build transaction
router.post('/register', async (req, res, next)=>{
  const duplicationCheck = await userDAO.get({
    action: 'checkdoubleUserInfo',
    user: {
      sign_id: req.body.id,
      nickname: req.body.name,
    }
  });
  if (duplicationCheck.successMsg) {
    // register
    const insertUserResult = await userDAO.insert({
      action: 'insertUser',
      user: {
        sign_id: req.body.id,
        password: req.body.password,
        nickname: req.body.name,
      }
    }).catch((err)=>{
      // err of db
      res.render('sign_result', {
        user: {
          nickname:'',
          token:'',
          errorMsg:'資料庫有誤，若持續發生請聯繫我們',
        },
      })
    });
    res.render('sign_result',{user: insertUserResult});
  } else {
    res.render('sign_result', {
      user: {
        nickname:'',
        token:'',
        errorMsg:duplicationCheck.errorMsg,
      },
    })
  } 
});

router.post('/signin', async (req, res, next)=>{
  const signinResult = await userDAO.get({
    action: 'sign-in',
    user: {
      sign_id: req.body.id,
      password: req.body.password,
    },
  });
  let sendbackObj = {user: {}}
  sendbackObj.user.nickname = (typeof signinResult!=='undefined')?signinResult.nickname:'';
  sendbackObj.user.token = (typeof signinResult!=='undefined')?signinResult.token:'';
  res.render('sign_result', sendbackObj);
})

module.exports = router;
