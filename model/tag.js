/* eslint-disable require-jsdoc */
const {pool} = require('../util/mysql');

function insertNewTags(tagsArr) {
  // Insert all tags with ignore
  return new Promise((resolve, reject) => {
    const string =
      'INSERT IGNORE INTO tags(tag) VALUES ?';
    const condition = [tagsArr.map((e) => [e])];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Select tags id from db
function getTagIds(tagsArr) {
  return new Promise((resolve, reject) => {
    const string =
      'SELECT id FROM tags WHERE tag in ?';
    const condition = [[tagsArr]];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const response = result.map((obj) => obj.id);
        resolve(response);
      }
    });
  });
}

// insert items_tag with itemId and tagId
function insertItemTags(itemId, tagIdArr) {
  return new Promise((resolve, reject) => {
    const string =
      'INSERT INTO item_tags(item_id, tag_id) VALUES ?';
    const condition = [tagIdArr.map((id) => {
      return [itemId, id];
    })];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows);
      }
    });
  });
}

function getItemTagsByIdArr(itemIdArr) {
  return new Promise((resolve, reject) => {
    const string =
      `SELECT it.item_id, t.tag FROM tags t 
    JOIN item_tags it ON it.tag_id = t.id 
    WHERE it.item_id in ? `;
    const condition = [[itemIdArr]];
    pool.query(string, condition, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const response = [];
        result.forEach((e) => {
          e.tag = '#' + e.tag;
          response.push(e);
        });
        resolve(response);
      }
    });
  });
}

async function appendTagsToItemData(itemDataArr) {
  if (itemDataArr.length === 0) {
    return [];
  } else {
    const itemTagsArr = await getItemTagsByIdArr(itemDataArr.map((e) => e.id))
        .catch((err) => {
          throw err;
        });
    const hashItemTags = hashItemTagsMaker(itemTagsArr);
    // put tags into item data
    const itemDataWithTagsArr = itemDataArr.map((data) => {
      const itemId = data.id;
      data.tags = hashItemTags[itemId] ? hashItemTags[itemId] : [];
      return data;
    });
    return itemDataWithTagsArr;
  }

  function hashItemTagsMaker(itemTagsArr) {
    return itemTagsArr.reduce((acu, tagObj) => {
      if (acu[tagObj.item_id]) {
        acu[tagObj.item_id].push(tagObj.tag);
      } else {
        acu[tagObj.item_id] = [tagObj.tag];
      }
      return acu;
    }, {});
  }
}

module.exports = {
  insertNewTags,
  getTagIds,
  insertItemTags,
  appendTagsToItemData,
};
