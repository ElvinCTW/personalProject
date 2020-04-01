/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */
const express = require('express');
const router = express.Router();
const {
  insertNewWantProcess,
  getMatchesCheckDataProcess,
  getSelectedItemsProcess,
  confirmTradeProcess,
  getInvitationPageDataProcess,
} = require('../controller/want');

// item_detail page 建立 want 用
router.post('/new', insertNewWantProcess);
// want 配對頁面讀取未成立交換資料用
router.get('/check', getMatchesCheckDataProcess);
// 配對頁面按下確認鍵時用
router.post('/confirm', confirmTradeProcess);
// Get data of already selected items last time
router.get('/last', getSelectedItemsProcess);
// Get data of invitation page
router.get('/invitation', getInvitationPageDataProcess);

module.exports = router;
