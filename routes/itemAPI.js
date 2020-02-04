const express = require('express');
const router = express.Router();
const userDAO = require('../dao/user');
const itemDAO = require('../dao/item');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const awsConfig = require('../util/awsConfig')

// multer setting
const s3 = new aws.S3({
  accessKeyId: awsConfig.accessKeyId,
  secretAccessKey: awsConfig.secretAccessKey,
});
// Add new item API
router.post('/new', async (req, res, next) => {
  /** Input : req.body from add items page */
  /** To Do : get user data add item into db */
  // upload pictures to s3 and get pics name
  let userID;
  let userNickname;
  const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'triangletradeelvintokyo',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read',
      key: async function (req, file, cb) {
        // check picture uploaded
        // if (!file) {
        //   console.log('no file');
        //   res.status(400).send('plz select picture');
        // }
        // if (file.length === 0) {
        //   console.log(file.length === 0);
        //   res.status(400).send('plz select picture');
        // }
        // get user data
        const userDataArr = await userDAO.get(req.body.token);
        userID = userDataArr[0].sign_id;
        userNickname = userDataArr[0].nickname;
        cb(null, `userUpload/${userNickname}/${userNickname}-` + Date.now().toString())
      }
    })
  }).fields([{ name: "pictures", maxCount: 6 }])
  upload(req, res, async (err) => {
    if (!req.files.pictures) {
      res.status(400).send('Please choose pictures');
      return;
    }
    if (err) {
      console.log(err);
      res.status(500).send('err of s3 service')
    }
    // get pics name & make them an string
    const pictures = req.files.pictures;
    let picturesString = '';
    for (let i = 0; i < pictures.length; i++) {
      picturesString += `${pictures[i].key},`
    }
    // insert item
    const insertItemResult = await itemDAO.insert({
      user_id: userID,
      user_nickname: userNickname,
      main_category: req.body.main_category,
      sub_category: req.body.sub_category,
      tags: req.body.tags,
      title: req.body.title,
      status: req.body.status,
      count: req.body.count,
      introduction: req.body.introduction,
      // change this after finish multer-s3
      pictures: picturesString,
      time: Date.now().toString(),
    })
    /** Output : success or error msg */
    if (insertItemResult.errorMsg) {
      res.status(500).send(insertItemResult.errorMsg)
    } else {
      res.status(200).send({
        insertStatus: 'success',
      })
    }
  });
})
// get recommmand items
router.get('/:type', async (req, res, next) => {
  /** Input: query */
  // Lastest items for someone not member
  if (req.params.type === 'all' || req.params.type === 'detail') {
    let token = null;
    let user_nickname = null;
    if (req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (req.query.user_nickname) {
      user_nickname = req.query.user_nickname
    }
    const getItemResultArr = await itemDAO.get({
      type: req.params.type || null,
      page: req.query.page || 0,
      main_category: req.query.main_category || null,
      sub_category: req.query.sub_category || null,
      item_id: req.query.item_id || null,
      token: token,
      user_nickname: user_nickname,
    })
    if (!getItemResultArr.errorMsg) {
      res.status(200).send(getItemResultArr);
    } else {
      console.log(getItemResultArr.errorMsg);
      res.status(500).send(insertItemResult.errorMsg);
    }
  } else {
    res.status(400).send('plz choose correct type : /all /detail');
  }
})

module.exports = router;