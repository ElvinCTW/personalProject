const MyError = require('../util/myError');
/* eslint-disable require-jsdoc */
async function insertItemProcess(req, res) {
  const {insertNewItem} = require('../model/item');
  const {insertItemCategory} = require('../model/category');

  if (!req.files.pictures) {
    throw new MyError(400, 'user did not gave picture');
  }

  // get pics name & make them an string
  const pictures = req.files.pictures;
  let picturesString = '';
  for (let i = 0; i < pictures.length; i++) {
    picturesString += `${pictures[i].key},`;
  }

  // insert item
  const insertItemResult = await insertNewItem({
    user_id: req.body.userID,
    title: req.body.title,
    status: req.body.status,
    introduction: req.body.introduction,
    pictures: picturesString,
  });

  const insertCategoryCount = await insertItemCategory({
    main_category_id: req.body.main_category,
    sub_category_id: req.body.sub_category,
    item_id: insertItemResult.insertId,
  }).catch((e)=>{
    console.log(e.message);
  });

  const tagsArr = req.body.tags.replace(/#/g, '').split(' ');
  await insertItemTags(insertItemResult.insertId, tagsArr)
      .catch((err) => {
        console.log(err);
      });

  if (insertCategoryCount === 1) {
    res.status(200).render('item_result', {successMsg: '新增物品成功!'});
  } else {
    res.status(500).render('item_result',
        {errorMsg: '抱歉，新增物品失敗><若持續發生請聯繫我們'});
  }
}

async function insertItemTags(itemId, tagsArr) {
  const {insertNewTags, getTagIds, insertItemTags} = require('../model/tag');
  await insertNewTags(tagsArr);
  const tagIdArr = await getTagIds(tagsArr);
  const insertedTagsOfItemCount = await insertItemTags(itemId, tagIdArr);
  if (tagIdArr.length !== insertedTagsOfItemCount) {
    console.log('Counts of item tags insertion was wrong :');
    console.log(`Counts of tags: ${tagIdArr.length},
    counts of insertion ${insertedTagsOfItemCount}`);
  }
}

async function getItemDataProcess(req, res) {
  const {getItemDataByType} = require('../model/item');
  const {appendTagsToItemData} = require('../model/tag');
  const nickname = req.query.nickname ?
    req.query.nickname : null;
  const page = req.query.page ? req.query.page : 0;
  const category = {};
  category.main_category = req.query.main_category ?
    req.query.main_category : null;
  category.sub_category = req.query.sub_category ?
    req.query.sub_category : null;
  category.status = req.query.status ?
    req.query.status : null;
  const itemDataArr = await getItemDataByType(page, category, nickname)
      .catch((err) => {
        throw err;
      });
  const itemDataWithTagsArr = await appendTagsToItemData(itemDataArr)
      .catch((err) => {
        res.status(500).send(err);
      });
  if (itemDataWithTagsArr) {
    res.status(200).send(itemDataWithTagsArr);
  }
}

module.exports = {
  insertItemProcess,
  getItemDataProcess,
};
