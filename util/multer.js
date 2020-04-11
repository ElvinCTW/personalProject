const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const {accessKeyId, secretAccessKey} = require('../util/awsConfig');
const {getUserDataByToken} = require('../model/user');

const upload = multer({
  storage: multerS3({
    s3: new aws.S3({accessKeyId, secretAccessKey}),
    bucket: 'triangletradeelvintokyo',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: async function(req, file, cb) {
      const userDataArr = await getUserDataByToken(req.body.token)
          .catch(() => {
            throw new MyError(500, 'db error');
          });
      if (userDataArr[0]) {
        req.body.userID = userDataArr[0].id;
        const userNickname = userDataArr[0].nickname;
        cb(null, `userUpload/${userNickname}/${userNickname}-`+
        Date.now().toString());
      } else {
        throw new MyError(403, 'cannot certificate user');
      }
    },
  }),
}).fields([{name: 'pictures', maxCount: 6}]);

module.exports = {
  upload,
};
