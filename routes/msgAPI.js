/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const {
  markMsgAsWatchedProcess,
  getSystemMsgProcess,
} = require('../controller/msg');

// Set single msg as watched
router.post('/watched', markMsgAsWatchedProcess);
// Get system msg for user
router.get('/header', getSystemMsgProcess);

module.exports = router;
