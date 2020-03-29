/* eslint-disable require-jsdoc */
const {
  registerTransaction,
  signInUser,
  updateWatchMsgTime,
  getLastMsgWatchedTime,
} = require('../model/user');

async function registerProcess(req, res) {
  const result = await registerTransaction(req.body)
      .catch((err) => {
        // err of db
        res.render('sign_result', {
          user: {
            nickname: '',
            token: '',
            errorMsg: '資料庫有誤，若持續發生請聯繫我們',
          },
        });
        console.log(err);
      });
  if (result) {
    res.render('sign_result', {user: result});
  }
}

async function singInProcess(req, res) {
  const signinResult = await signInUser(req.body.id, req.body.password);
  const sendbackObj = {user: {}};
  sendbackObj.user.nickname = (typeof signinResult !== 'undefined') ?
    signinResult.nickname : '';
  sendbackObj.user.token = (typeof signinResult !== 'undefined') ?
    signinResult.token : '';
  res.render('sign_result', sendbackObj);
}

async function updateWatchMsgTimeProcess(req, res) {
  // call function in userDAO to change watch_msg_time
  const token = req.headers.authorization.split(' ')[1];
  const updateSuccess = await updateWatchMsgTime(token)
      .catch(() => { });
  if (updateSuccess) {
    res.send(updateSuccess);
  } else {
    res.status(403);
  }
}

async function getLastWatchedTimeProcess(req, res) {
  const token = req.headers.authorization.split(' ')[1];
  const time = await getLastMsgWatchedTime(token)
      .catch(() => {
        res.status(403).send();
      });
  if (time) {
    res.send(time);
  }
}

module.exports = {
  registerProcess,
  singInProcess,
  updateWatchMsgTimeProcess,
  getLastWatchedTimeProcess,
};
