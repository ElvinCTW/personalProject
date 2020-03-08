// Settings
const express = require('express');
const app = express();
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const userAPI = require('./routes/userAPI');
const itemAPI = require('./routes/itemAPI');
const wantAPI = require('./routes/wantAPI');
const msgAPI = require('./routes/msgAPI');
const categoryAPI = require('./routes/categoryAPI');
const { getItemDetail } = require('./dao/item');
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
  res.render('index', await getHomePageData(req))
});
// sign up
app.get('/users/signup', (req, res) => { res.render('signup') });
// want related
app.get('/want/invitation', (req, res) => { res.render('want_invitation')})
app.get('/want/check', (req, res) => { res.render('want_check') });
app.get('/matches/confirmed', (req, res) => { res.render('match_confirmed') });
// Items
app.get('/items/new', (req, res) => { res.render('items_add') });
app.get('/items/gone', async (req, res) => {
  res.render('items_detail_gone', await getItemDetail(req.query.item_id, 'gone'))
});
app.get('/items/detail', async (req, res) => {
  res.render('items_detail', await getItemDetail(req.query.item_id))
});

/**
 * API Routers 
 */
app.use('/api/1.0/users', userAPI);
app.use('/api/1.0/items', itemAPI);
app.use('/api/1.0/want', wantAPI);
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

async function getHomePageData(req) {
  const { mainBoardsList, statusList } = require('./util/listData');
  const awsConfig = require('./util/awsConfig');
  let resData = { mainBoardsList };
  resData.categories = await getSideBarList(req.query)
  if (!req.query.status && req.query.main_category && req.query.sub_category) {
    resData.statusList = statusList
  }
  // 添加 queries
  Object.keys(req.query).forEach(query => {
    resData[query] = req.query[query]
  })
  if (req.query.search) {
    let { itemsDataArr, keywordString } = await getSearchData(req.query.search);
    resData.s3_url = awsConfig.s3_url
    resData.searchDataArr = itemsDataArr
    resData.keywordString = keywordString
  }
  return resData

  async function getSideBarList(query) {
    let queryData = {};
    const categoryDAO = require('./dao/categoryDAO');
    if (!query.main_category) { // '/'
      // 取得main_categories
      queryData.action = 'getMainCategories'
    } else if (!query.sub_category) { // '/?main_category'
      // 取得sub_categories
      queryData.action = 'getSubCategories'
      queryData.main_category = query.main_category
    } else if (!query.status) { // '/?main_category&sub_category'
      // 取得物品狀態
      queryData.action = 'doNothing'
    } else { // '/?main_category&sub_category&status'
      // 不用取得list
      queryData.action = 'doNothing'
    }
    let categories = await categoryDAO.get(queryData);
    return categories
  }

  async function getSearchData(search) {
    const { getItemDataFromSearchBar } = require('./dao/item');
    let titleArr = [];
    let hashtagArr = [];
    search.split(' ').filter(string => string !== '').forEach(string => {
      let array = string.slice(0, 1) === '#' ? hashtagArr : titleArr;
      array.push(string);
    });
    hashtagArrWithHash = hashtagArr.filter(hash => hash !== '')
    hashtagArr = hashtagArrWithHash.map(hashtag => hashtag.slice(1))
    let itemsDataArr = await getItemDataFromSearchBar(titleArr, hashtagArr)
    let keywordString = ''
    if (titleArr.length > 0 && hashtagArrWithHash.length > 0) {
      titleArr.map(keyword => '/' + keyword).concat(hashtagArrWithHash).forEach(keyword => { resData.keywordString += keyword + ' ' })
    } else if (titleArr.length > 0) {
      titleArr.forEach(keyword => { keywordString += '/' + keyword + ' ' })
    } else {
      hashtagArrWithHash.forEach(keyword => { keywordString += keyword + ' ' })
    }
    keywordString += '> '
    return { itemsDataArr, keywordString }
  }
}

module.exports = app;