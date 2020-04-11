/* eslint-disable require-jsdoc */
// Set connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', ()=>{
  console.log('MongoDB connected!');
});

// Set schema and methods
// Want
const wantTreeSchema = new mongoose.Schema({
  wantItemId: Number,
  requiredItemsId: Array,
});

wantTreeSchema.methods.getWantItemId = function() {
  return _getWantItemId();
};
function _getWantItemId() {
  return this.wantItemId;
}

wantTreeSchema.methods.setWantItemId = function(itemId) {
  return _setWantItemId(itemId);
};
function _setWantItemId(itemId) {
  this.wantItemId = itemId;
};

wantTreeSchema.methods.getRequiredItems = function() {
  return _getRequiredItems();
};
function _getRequiredItems() {
  return this.requiredItemsId;
};

wantTreeSchema.methods.setRequiredItems = function(itemIdArray) {
  return _setRequiredItems(itemIdArray);
};
function _setRequiredItems(itemIdArray) {
  this.requiredItemsId.length = 0;
  itemIdArray.forEach((itemId)=>{
    this.requiredItemsId.push(itemId);
  });
};

wantTreeSchema.methods.insertMongoDB = function() {
  return _insertMongoDB();
};
async function _insertMongoDB() {
  // Check empty value or wrong type
  if (!this.wantItemId ||
    typeof this.wantItemId !== 'number' ||
    this.requiredItemsId.length === 0 ) {
    return false;
  }
  this.requiredItemsId.forEach((itemId)=>{
    if (typeof itemId !== 'number') return false;
  });

  // Insert data
  return new Promise(function(resolve, reject) {
    this.save(function(err, item) {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    });
  });
}

const WantTree = mongoose.model('WantTree', userSchema, 'WantTree');

module.exports = {
  WantTree,
};
