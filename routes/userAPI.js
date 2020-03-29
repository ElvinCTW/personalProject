/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const {
  registerProcess,
  singInProcess,
  updateWatchMsgTimeProcess,
  getLastWatchedTimeProcess,
} = require('../controller/user');

// New user register
router.post('/register', registerProcess);
// User sign in
router.post('/signin', singInProcess);
// Update user record of watch message time
router.put('/watchMsgTime', updateWatchMsgTimeProcess);
// Get user record of last time watch message
router.get('/lastMsgWatchedTime', getLastWatchedTimeProcess);

module.exports = router;
