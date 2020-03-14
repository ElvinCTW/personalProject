const express = require('express');
const router = express.Router();

// Add new item API
router.post('/new', async (req, res) => {
  let userID;
  let userNickname;
  const aws = require('aws-sdk');
  const multer = require('multer');
  const multerS3 = require('multer-s3');
  const { accessKeyId, secretAccessKey } = require('../util/awsConfig');
  const { getUserDataByToken } = require('../dao/user');
  const { insertNewItem } = require('../dao/item');
  const { insertItemCategory } = require('../dao/categoryDAO');
  const upload = multer({
    storage: multerS3({
      s3: new aws.S3({ accessKeyId, secretAccessKey }),
      bucket: 'triangletradeelvintokyo',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read',
      key: async function (req, file, cb) {
        const userDataArr = await getUserDataByToken(req.body.token);
        userID = userDataArr[0].id;
        userNickname = userDataArr[0].nickname;
        cb(null, `userUpload/${userNickname}/${userNickname}-` + Date.now().toString());
      }
    })
  }).fields([{ name: 'pictures', maxCount: 6 }]);
  upload(req, res, async (err) => {
    console.log('req.body');
    console.log(req.body);
    if (!req.files.pictures) {
      console.log('no pic, itemAPI');
      res.status(400).send('Please choose pictures');
      return;
    }
    if (err) {
      console.log('err, itemAPI');
      console.log(err);
      res.status(500).send('err of s3 service');
      return;
    }
    // get pics name & make them an string
    const pictures = req.files.pictures;
    let picturesString = '';
    for (let i = 0; i < pictures.length; i++) {
      picturesString += `${pictures[i].key},`;
    }
    // insert item
    const insertItemResult = await insertNewItem({
      user_id: userID,
      tags: req.body.tags,
      title: req.body.title,
      status: req.body.status,
      introduction: req.body.introduction,
      pictures: picturesString,
      time: Date.now().toString(),
    });

    const insertCount = await insertItemCategory({
      main_category_id: req.body.main_category,
      sub_category_id: req.body.sub_category,
      item_id: insertItemResult.insertId,
    });

    if (insertCount === 1) {
      res.status(200).render('item_result', { successMsg: '新增物品成功!' });
    } else {
      res.status(500).render('item_result', { errorMsg: '抱歉，新增物品失敗><若持續發生請聯繫我們' });
    }
    
  });
});
// get recommmand items
router.get('/all', async (req, res) => {
  // Lastest items for someone not member
  await getItemDataProcess(req)
    .then(ItemDataArr => { res.status(200).send(ItemDataArr); })
    .catch(err => { res.status(500).send(err); return; });
});

async function getItemDataProcess(req) {
  const { getItemDataByType } = require('../dao/item');
  const nickname = req.query.user_nickname ?
    req.query.user_nickname : null;
  const page = req.query.page ? req.query.page : 0;
  let category = {};
  category.main_category = req.query.main_category ?
    req.query.main_category : null;
  category.sub_category = req.query.sub_category ?
    req.query.sub_category : null;
  category.status = req.query.status ?
    req.query.status : null;
  let ItemDataArr = await getItemDataByType(page, category, nickname)
    .catch(err => { throw err; });
  return ItemDataArr;
}

module.exports = router;