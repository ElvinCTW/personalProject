const express = require('express');
const router = express.Router();
const {registerTransaction, signinProcess} = require('../dao/user');

router.post('/register', async (req, res, next)=>{
  await registerTransaction(req.body)
    .catch((err)=>{
      // err of db
      res.render('sign_result', {
        user: {
          nickname:'',
          token:'',
          errorMsg:'資料庫有誤，若持續發生請聯繫我們',
        },
      })
      console.log(err)
    })
    .then(result=>{
      console.log('result')
      console.log(result)
      if (result.errorMsg) {
        res.render('sign_result', {
          user: {
            nickname:'',
            token:'',
            errorMsg:result.errorMsg,
          },
        })
      } else {
        res.render('sign_result',{user: result})
      }
    })
})

router.post('/signin', async (req, res, next)=>{
  const signinResult = await signinProcess(req.body.id, req.body.password)
  let sendbackObj = {user: {}}
  sendbackObj.user.nickname = (typeof signinResult!=='undefined')?signinResult.nickname:'';
  sendbackObj.user.token = (typeof signinResult!=='undefined')?signinResult.token:'';
  res.render('sign_result', sendbackObj);
})

module.exports = router;
