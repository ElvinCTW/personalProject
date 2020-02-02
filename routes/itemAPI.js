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
// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: 'triangletradeelvin',
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     acl: 'public-read',
//     key: function (req, file, cb) {
//       console.log(file);
//       cb(null, +'userUpload/'+Date.now().toString())
//     }
//   })
// })
// const cpUpload = upload.fields([{ name: "pictures", maxCount: 6 }]);
router.post('/add', async (req, res, next) => {
  /** Input : req.body from add items page */
  /** To Do : get user data add item into db */
  // get user data
  // console.log(req.body);
  // const userDataArr = await userDAO.get(req.body.token);
  // const userID = userDataArr[0].sign_id
  // upload pictures to s3 and get pics name
  let userID;
  let userNickname;
  console.log(Date());
  const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'triangletradeelvin',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read',
      key: async function (req, file, cb) {
        console.log(Date());
        const userDataArr = await userDAO.get(req.body.token);
        userID = userDataArr[0].sign_id;
        userNickname = userDataArr[0].nickname;
        cb(null, `userUpload/${userNickname}/` + Date.now().toString())
      }
    })
  }).fields([{ name: "pictures", maxCount: 6 }])
  upload(req, res, async (err) => {
    console.log(Date());
    if (!req.files) {
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
      main_category: req.body.main_category,
      sub_category: req.body.sub_category,
      tags: req.body.tags,
      title: req.body.title,
      status: req.body.status,
      count: req.body.count,
      introduction: req.body.insert,
      // change this after finish multer-s3
      pictures: picturesString,
    })
    /** Output : success or error msg */
    if (insertItemResult.errorMsg) {
      res.status(500).send(insertItemResult.errorMsg)
    } else {
      console.log(Date());
      res.status(200).send({
        insertStatus: 'success',
      })
    }
  });
})

module.exports = router;