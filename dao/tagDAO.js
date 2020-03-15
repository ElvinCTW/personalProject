const { pool } = require('../util/mysql');

function insertNewTags(tagsArr) {
  // Insert all tags with ignore 
  return new Promise((resolve, reject) => {
    const string =
      'INSERT IGNORE INTO tags(tag) VALUES ?';
    const condition = [tagsArr.map(e=>[e])];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); }
      else { resolve(result); }
    });
  });
}

// Select tags id from db
function getTagIds(tagsArr) {
  return new Promise((resolve,reject)=>{
    const string = 
    'SELECT id FROM tags WHERE tag in ?';
    const condition = [[tagsArr]];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); }
      else {
        const response = result.map(obj=>obj.id);
        resolve(response); 
      }
    });
  });
}

// insert items_tag with itemId and tagId
function insertItemTags(itemId, tagIdArr) {
  return new Promise((resolve,reject)=>{
    const string = 
    'INSERT INTO item_tags(item_id, tag_id) VALUES ?';
    const condition = [tagIdArr.map((id)=>{return [itemId,id];})];
    pool.query(string, condition, (err, result) => {
      if (err) { reject(err); }
      else { resolve(result.affectedRows); }
    });
  });
}
module.exports = {
  insertNewTags,
  getTagIds,
  insertItemTags,
};