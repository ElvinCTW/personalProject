// Settings
const createError = require('http-errors');
const express = require('express');
const userAPI = require('./routes/userAPI');
const itemAPI = require('./routes/itemAPI');
const wantAPI = require('./routes/wantAPI');
const matchesAPI = require('./routes/matchesAPI');
const itemDAO = require('./dao/item');
const wantDAO = require('./dao/wantDAO');
// const matchDAO = require('./dao/matchDAO');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({exetended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Views */
// Index
app.get('/', (req, res) => {res.render('index')});
// Users
app.get('/users/signin', (req,res)=>{res.render('signin')});
app.get('/users/signup', (req,res)=>{res.render('signup')});
// Items
app.get('/items/new', (req,res)=>{res.render('items_add')});
app.get('/items/detail', async (req,res)=>{
  let itemDetailData = await itemDAO.get({
    type: 'detail',
    item_id: req.query.item_id,
  })
  res.render('items_detail',itemDetailData[0])
});
// Check non-confirmed matches
app.get('/matches/information', async (req,res)=>{
  // get data with first match in the list, need to check if no matches at all
  let objectOfmatchesResultArr = await wantDAO.get({
    user_nickname: req.query.user_nickname,
  });
  // console.log('objectOfmatchesResultArr');
  // console.log(objectOfmatchesResultArr);
  // console.log('objectOfmatchesResultArr.doubleMatchResultArr');
  // console.log(objectOfmatchesResultArr.doubleMatchResultArr);
  // console.log('objectOfmatchesResultArr.tripleMatchResultArr');
  // console.log(objectOfmatchesResultArr.tripleMatchResultArr);
  console.log('(objectOfmatchesResultArr.doubleMatchResultArr.length > 0 || objectOfmatchesResultArr.tripleMatchResultArr.length > 0)')
  console.log((objectOfmatchesResultArr.doubleMatchResultArr.length > 0 || objectOfmatchesResultArr.tripleMatchResultArr.length > 0))
  if (objectOfmatchesResultArr.doubleMatchResultArr.length > 0 || objectOfmatchesResultArr.tripleMatchResultArr.length > 0) {
    let tempArr = [];
    objectOfmatchesResultArr.doubleMatchResultArr.forEach(doubleMatch=>{
      tempArr.push( doubleMatch.B_id )
    })
    objectOfmatchesResultArr.tripleMatchResultArr.forEach(tripleMatch=>{
      tempArr.push( tripleMatch.B_id)
    })
    // 取得不重複 Array
    let setTempArr = [...new Set(tempArr)];
    // 過濾仍可取用之物品並取得資料
    objectOfmatchesResultArr.b_itemObjectArr = await itemDAO.get({
      type: 'all',
      id_Arr: setTempArr,
    });
    // console.log(objectOfmatchesResultArr.b_itemObjectArr);
  } else {
    objectOfmatchesResultArr.b_itemObjectArr = [];
  }
  console.log('objectOfmatchesResultArr.b_itemObjectArr')
  console.log(objectOfmatchesResultArr.b_itemObjectArr)
  console.log('objectOfmatchesResultArr')
  console.log(objectOfmatchesResultArr)
  res.render('match_check', objectOfmatchesResultArr)
});
// Check confirmed matches
app.get('/matches/confirmed', async (req,res)=>{
  let getConfirmedMatchesResultArr = await itemDAO.get({
    action: 'getConfirmedMatches',
    user_nickname: req.query.user_nickname,
    type: 'all',
  });

  res.render('match_confirmed', {
    getConfirmedMatchesResultArr:getConfirmedMatchesResultArr,
  });
})

// Boards
app.get('/boards/:board', async (req,res)=>{
  // call itemDAO to get board items
  let sub_category = null;
  if (req.query.sub_category) {
    sub_category = req.query.sub_category;
  }
  let itemDetailData = await itemDAO.get({
    type: 'all',
    main_category: req.params.board,
    sub_category: sub_category,
    page: 0,
  })
  // after get data, render board page with data
  res.render('board',itemDetailData)
});

/* API Routers */
app.use('/api/1.0/users', userAPI);
app.use('/api/1.0/items', itemAPI);
app.use('/api/1.0/want', wantAPI);
app.use('/api/1.0/matches', matchesAPI);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
