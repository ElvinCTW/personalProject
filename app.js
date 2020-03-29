/* eslint-disable require-jsdoc */
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
const {getHomePageData, getItemDetailData} = require('./controller/app');
const categoryAPI = require('./routes/categoryAPI');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.urlencoded({exetended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Views
 */
// Index
app.get('/', async (req, res) => {
  const homePageData = await getHomePageData(req)
      .catch((err)=>{
        console.log(err); res.render('index', {});
      });
  if (!homePageData) return;
  res.render('index', homePageData);
});
// sign up
app.get('/users/signup', (req, res) => {
  res.render('signup');
});
// want related
app.get('/want/invitation', (req, res) => {
  res.render('want_invitation');
});
app.get('/want/check', (req, res) => {
  res.render('want_check');
});
app.get('/matches/confirmed', (req, res) => {
  res.render('match_confirmed');
});
// Items
app.get('/items/new', (req, res) => {
  res.render('items_add');
});
app.get('/items/gone', async (req, res) => {
  res.render('items_detail_gone',
      await getItemDetailData(req.query.item_id, 'gone') );
});
app.get('/items/detail', async (req, res) => {
  res.render('items_detail', await getItemDetailData(req.query.item_id));
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
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
