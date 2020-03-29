/* eslint-disable require-jsdoc */
const {getMsgForHeader, markMsgAsWatched} = require('../model/msg');

async function markMsgAsWatchedProcess(req, res) {
  const token = req.headers.authorization.split(' ')[1] ?
  req.headers.authorization.split(' ')[1] : null;
  const id = req.query.id ? req.query.id : null;
  const affectedRows = await markMsgAsWatched(token, id)
      .catch((err) => console.log(err));
  res.send(`${affectedRows}`);
}

async function getSystemMsgProcess(req, res) {
  const token = req.headers.authorization.split(' ')[1] ?
  req.headers.authorization.split(' ')[1] : null;
  if (token) {
    const unreadMsgArr = await getMsgForHeader(token)
        .catch((err) => {
          console.log(err);
          res.status(500).send([]);
        });
    if (unreadMsgArr) {
      res.send(unreadMsgArr);
    };
  } else {
    res.status(400).send();
  }
}

module.exports = {
  markMsgAsWatchedProcess,
  getSystemMsgProcess,
};
