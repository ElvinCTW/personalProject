/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const {getItemType} = require('../controller/category');

// Get item type when user adding items
router.get('/item-insertion/:type', getItemType);

module.exports = router;
