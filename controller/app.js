/* eslint-disable require-jsdoc */
const {getCategories} = require('../model/category');
const {appendTagsToItemData} = require('../model/tag');
const {getItemDetail} = require('../model/item');

async function getHomePageData(req) {
  const {statusList} = require('../util/listData');
  const awsConfig = require('../util/awsConfig');
  const resData = {};
  resData.categories = await getCategories(req.query);
  if (!req.query.status && req.query.main_category && req.query.sub_category) {
    resData.statusList = statusList;
  }
  // 添加 search queries
  Object.keys(req.query).forEach((query) => {
    resData[query] = req.query[query];
  });
  if (req.query.search) {
    const {itemsDataArr, keywordString} = await getSearchData(req.query.search);
    resData.s3URL = awsConfig.s3URL;
    resData.searchDataArr = itemsDataArr;
    resData.keywordString = keywordString;
  }
  return resData;

  async function getSearchData(search) {
    const {getItemDataFromSearchBar} = require('../model/item');
    const titleArr = [];
    let hashtagArr = [];
    // uniform search content
    search.split(' ').filter((string) => string !== '').forEach((string) => {
      const array = string.slice(0, 1) === '#' ? hashtagArr : titleArr;
      array.push(string);
    });
    const hashtagArrWithHash = hashtagArr.filter((hash) => hash !== '');
    hashtagArr = hashtagArrWithHash.map((hashtag) => hashtag.slice(1));
    let itemsDataArr = await getItemDataFromSearchBar(titleArr, hashtagArr);
    itemsDataArr = await appendTagsToItemData(itemsDataArr);
    let keywordString = '';
    if (titleArr.length > 0 && hashtagArrWithHash.length > 0) {
      titleArr.map((keyword) => '/' + keyword)
          .concat(hashtagArrWithHash)
          .forEach((keyword) => {
            keywordString += keyword + ' ';
          });
    } else if (titleArr.length > 0) {
      titleArr.forEach((keyword) => {
        keywordString += '/' + keyword + ' ';
      });
    } else {
      hashtagArrWithHash.forEach((keyword) => {
        keywordString += keyword + ' ';
      });
    }
    keywordString += '> ';
    return {itemsDataArr, keywordString};
  }
}

async function getItemDetailData(itemId, gone) {
  const itemDetail = gone ?
  await getItemDetail(itemId, 'gone'):
  await getItemDetail(itemId);
  const itemDataArrWithTags = await appendTagsToItemData([itemDetail]);
  return itemDataArrWithTags[0];
}

module.exports = {
  getHomePageData,
  getItemDetailData,
};
