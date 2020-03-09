const express = require('express');
const router = express.Router();

// Add new item API
router.post('/new', async (req, res, next) => {
  await addNewItemProcess(req, res)
    .catch(err=>{
      console.log('err')
      console.log(err)
      res.status(500).render('item_result', { errorMsg: '資料庫有誤，請稍候再試QQ' })
    })
    .then(result=>{res.status(200).render('item_result', { successMsg: '新增物品成功!' })})
})
// get recommmand items
router.get('/all', async (req, res, next) => {
  // Lastest items for someone not member
  await getItemDataProcess(req)
  .then(ItemDataArr=>{res.status(200).send(ItemDataArr)})
  .catch(err=>{res.status(500).send(err); return})
})

async function addNewItemProcess(req, res) {
  let userID;
  let userNickname;
  const aws = require('aws-sdk');
  const multer = require('multer');
  const multerS3 = require('multer-s3');
  const { accessKeyId, secretAccessKey } = require('../util/awsConfig')
  const { getUserDataByToken } = require('../dao/user');
  const { insertNewItem} = require('../dao/item');
  const upload = multer({
    storage: multerS3({
      s3: new aws.S3({ accessKeyId, secretAccessKey }),
      bucket: 'triangletradeelvintokyo',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read',
      key: async function (req, file, cb) {
        const userDataArr = await getUserDataByToken(req.body.token)
        userID = userDataArr[0].id;
        userNickname = userDataArr[0].nickname;
        cb(null, `userUpload/${userNickname}/${userNickname}-` + Date.now().toString())
      }
    })
  }).fields([{ name: "pictures", maxCount: 6 }])
  upload(req, res, async (err) => {
    console.log('req.body')
    console.log(req.body)
    if (!req.files.pictures) {
      console.log('no pic, itemAPI');
      res.status(400).send('Please choose pictures');
      return;
    }
    if (err) {
      console.log('err, itemAPI');
      console.log(err);
      res.status(500).send('err of s3 service')
      return
    }
    // get pics name & make them an string
    const pictures = req.files.pictures;
    let picturesString = '';
    for (let i = 0; i < pictures.length; i++) {
      picturesString += `${pictures[i].key},`
    }
    // insert item
    const insertItemResult = await insertNewItem({
      user_id: userID,
      main_category: req.body.main_category,
      sub_category: req.body.sub_category,
      tags: req.body.tags,
      title: req.body.title,
      status: req.body.status,
      introduction: req.body.introduction,
      pictures: picturesString,
      time: Date.now().toString(),
    }).catch((err) => {throw err})
    return insertItemResult
  });
}

async function getItemDataProcess(req) {
  const {getItemDataByType } = require('../dao/item');
  const nickname = req.query.user_nickname ?
    req.query.user_nickname : null;
  const page = req.query.page ? req.query.page : 0;
  let category = {}
  category.main_category = req.query.main_category ?
    req.query.main_category : null;
  category.sub_category = req.query.sub_category ?
    req.query.sub_category : null;
  category.status = req.query.status ?
    req.query.status : null;
  let ItemDataArr = await getItemDataByType(page, category, nickname)
    .catch(err=> {throw err})
  return ItemDataArr
}

module.exports = router;