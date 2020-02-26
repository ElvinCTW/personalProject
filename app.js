// Settings
const createError = require('http-errors');
const express = require('express');
const userAPI = require('./routes/userAPI');
const itemAPI = require('./routes/itemAPI');
const wantAPI = require('./routes/wantAPI');
const categoryAPI = require('./routes/categoryAPI');
const matchesAPI = require('./routes/matchesAPI');
const msgAPI = require('./routes/msgAPI');
const itemDAO = require('./dao/item');
const categoryDAO = require('./dao/categoryDAO');
// const wantDAO = require('./dao/wantDAO');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const app = express();
const listData = require('./util/listData');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ exetended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Views 
 */
// Index
app.get('/', async (req, res) => {
  let queryData = {};
  let resData = {mainBoardsList: listData.mainBoardsList};
  if (!req.query.main_category) {
    // 取得main_categories
    queryData.action = 'getMainCategories'
  } else if (req.query.main_category && !req.query.sub_category) {
    // 取得sub_categories
    queryData.action = 'getSubCategories'
    queryData.main_category=req.query.main_category
  } else {
    // 不用取得list
    queryData.action = 'doNothing'
  }
  // 添加 queries
  Object.keys(req.query).forEach(query=>{
    resData[query]=req.query[query]
  })
  resData.categories = await categoryDAO.get(queryData);
  console.log('resData')
  console.log(resData)
  res.render('index', resData)
});
// sign up
app.get('/users/signup', (req, res) => { res.render('signup') });
// Items
app.get('/items/new', (req, res) => { res.render('items_add') });
app.get('/items/detail', async (req, res) => {
  let itemDetailData = await itemDAO.get({
    type: 'detail',
    item_id: req.query.item_id,
  })
  res.render('items_detail', itemDetailData[0])
});
// Matches
// Check non-confirmed matches
app.get('/want/check', async (req, res) => { res.render('match_check') });
// Check confirmed matches
app.get('/matches/confirmed', async (req, res) => {
  res.render('match_confirmed');
});
// Boards
app.get('/boards', async (req, res) => {
  // call itemDAO to get board items
  // let sub_category = null;
  // if (req.query.sub_category) {
  //   sub_category = req.query.sub_category;
  // }
  // let itemDetailData = await itemDAO.get({
  //   type: 'all',
  //   main_category: req.params.board,
  //   sub_category: sub_category,
  //   page: 0,
  // })
  // after get data, render board page with data
  res.render('board', itemDetailData)
});

/**
 * API Routers 
 */
app.use('/api/1.0/users', userAPI);
app.use('/api/1.0/items', itemAPI);
app.use('/api/1.0/want', wantAPI);
app.use('/api/1.0/matches', matchesAPI);
app.use('/api/1.0/message', msgAPI);
app.use('/api/1.0/category', categoryAPI);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
