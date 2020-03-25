/* eslint-disable require-jsdoc */
async function getHomePageData(req) {
  const {statusList} = require('../util/listData');
  const awsConfig = require('../util/awsConfig');
  const resData = {};
  resData.categories = await getSideBarList(req.query);
  if (!req.query.status && req.query.main_category && req.query.sub_category) {
    resData.statusList = statusList;
  }
  // 添加 queries
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

  async function getSideBarList(query) {
    const queryData = {};
    const categoryDAO = require('../model/category');
    if (!query.main_category) { // '/'
      // 取得main_categories
      queryData.action = 'getMainCategories';
    } else if (!query.sub_category) { // '/?main_category'
      // 取得sub_categories
      queryData.action = 'getSubCategories';
      queryData.main_category = query.main_category;
    } else if (!query.status) { // '/?main_category&sub_category'
      // 取得物品狀態
      queryData.action = 'doNothing';
    } else { // '/?main_category&sub_category&status'
      // 不用取得list
      queryData.action = 'doNothing';
    }
    const categories = await categoryDAO.get(queryData);
    return categories;
  }

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

module.exports = {
  getHomePageData,
};
