// Settings
const createError = require('http-errors');
const express = require('express');
const userAPI = require('./routes/userAPI')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Views */
// Index
app.get('/', (req, res) => {res.render('index')});
// Users
app.get('/users/signin', (req,res)=>{res.render('signin')});
app.get('/users/signup', (req,res)=>{res.render('signup')});
// Items
app.get('/items/add', (req,res)=>{res.render('items_add')});

/* API Routers */
app.use('/api/1.0/users', userAPI);

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
