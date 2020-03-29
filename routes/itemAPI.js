/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */
const express = require('express');
const router = express.Router();
const {insertItemProcess, getItemDataProcess} = require('../controller/item');
const {upload} = require('../util/multer');

// Add new item
router.post('/new', upload, insertItemProcess);
// Get items data
router.get('/all', getItemDataProcess);

module.exports = router;
