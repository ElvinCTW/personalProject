/* eslint-disable require-jsdoc */
const {getCategories} = require('../model/category');

async function getItemType(req, res) {
  const obj = {};
  obj.main_category = req.params.type === 'main' ? null :
    req.query.main_category;
  const resObj = await getCategories(obj)
      .catch(() => {
        res.status(500).send({errorMsg: 'get categoryList error'});
      });
  if (resObj) {
    res.status(200).send(resObj.listData);
  }
}

module.exports = {
  getItemType,
};
