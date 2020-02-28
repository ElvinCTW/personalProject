const msgDAO = require('../dao/msgDAO');
const itemDAO = require('../dao/item');
const matchDAO = require('../dao/matchDAO');
const userDAO = require('../dao/user');

module.exports = {
  init: (server) => {
    const io = require('socket.io')(server, {
      pingTimeout: 60000,
    });
    let socketObj = {};
    /**
     * io.emit => 送廣播給前端
     * socket.on => 監聽 socket 事件
     * message = 訊息事件
     */
    io.on('connection', (socket) => {
      console.log('a user connected');
      // store sockets
      socketObj[socket.id] = socket;
      /**
       * .on
       */
      // Get matchedId & matchedItemData & lastest msg
      socket.on('join', async (obj) => {
        let confirmedMatchArr = await itemDAO.get({
          action: 'getConfirmedMatches',
          token: obj.token,
          type: 'all',
        }).catch(err => { res.status(500).send({ errorMsg: '資料庫錯誤' }) });
        let matchedIdArr = confirmedMatchArr.map(match => `${match.matched_id}`)
        socket.join(matchedIdArr); // 把 socket 加入所屬交易的對話房間(s)
        // 取得每個 match 的最新一筆訊息
        let lastestMsgArr = await msgDAO.get({
          action: 'getLastestMsg',
          matchedIdArr: matchedIdArr,
        })
        // console.log('socket')
        // console.log(socket)
        console.log('socket.rooms')
        console.log(socket.rooms)
        if (confirmedMatchArr&&lastestMsgArr) {
          io.to(socket.id).emit('join', { 
            confirmedMatchArr: confirmedMatchArr,
            lastestMsgArr:lastestMsgArr,
           })
        }
      })
      // Get history request
      socket.on('history', async (obj) => {
        // Get history from db
        let checkValidUser = await itemDAO.get({
          action: 'checkVaildUserOfMatchDialog',
          token: obj.token,
          matched_id: obj.matched_id,
        }).catch(err => {
          console.log(err.errorMsg);
          alert('暫時無法取得您的身份QQ，若持續發生請聯絡我們')
        })
        if (checkValidUser.length === 1) {
          // content, sender, time
          let msgArr = await msgDAO.get({
            action: 'getConfirmedMatchMsg',
            matched_id: parseInt(obj.matched_id),
          }).catch((err) => {
            console.log(err.errorMsg);
            res.status(500).send(err);
          });
          if (msgArr) {
            // 取得 matched_items_id
            let matchedItemsIdObj = await matchDAO.get({
              action: 'getConfirmedMatchItemsId',
              matched_id: parseInt(obj.matched_id),
            }).catch((err) => {
              console.log(err.errorMsg);
              res.status(500).send(err);
            });
            if (matchedItemsIdObj) {
              // 整理取得 item Data
              let idArr = Object.values(matchedItemsIdObj)
              let itemDataArr = await itemDAO.get({
                action: 'getConfirmedMatchItemsData',
                idArr: idArr,
              }).catch((err) => {
                console.log(err.errorMsg);
                res.status(500).send(err);
              });
              if (itemDataArr) {
                io.to(socket.id).emit('history', {
                  msgArr: msgArr,
                  itemDataArr: itemDataArr,
                  curMatch:obj.matched_id, 
                })
                // res.send({
                //   msgArr: msgArr,
                //   itemDataArr: itemDataArr,
                // })
              }
            }
          }
        }
        // send to target socket 
        // to(socketObj[socket.id])
      })
      // 處理訊息
      socket.on('message', async (obj)=>{
        // 確認本人
        console.log('server get emit');
        console.log(obj);
        let checkUser = await userDAO.get({
          action:'getUserDataByToken',
          token:obj.token,
        })
        console.log('checkUser')
        console.log(checkUser)
        if (checkUser.length>0 && checkUser[0].nickname === obj.data.sender) {
          // DB儲存對話
          console.log('start saving db');
          let currentTime = Date.now();
          obj.data.time=currentTime;
          obj.action='addNewMatchedPageMsg';
          console.log('obj')
          console.log(obj)
          let affectedRows = await msgDAO.insert(obj);
          console.log('affectedRows')
          console.log(affectedRows)
          if (affectedRows !== 1) {
            io.to(socket.id).emit('message-fail', {
              errorMsg:'用戶驗證失敗，請重新登入'
            })
            console.log('msgAPI did not insert msg correctly');
          } else {
            // 儲存成功後回傳訊息給聊天室
            console.log('here')
            console.log('obj.data.matched_id')
            console.log(obj.data.matched_id)
            console.log('socket.rooms')
            console.log(socket.rooms)
            io.to(obj.data.matched_id).emit('message', obj.data)
          }
        } else {
          console.log('用戶驗證失敗');
          io.to(socket.id).emit('message-fail', {
            errorMsg:'用戶驗證失敗，請重新登入'
          })
        }
        
      })

      console.log('socket.rooms')
      console.log(socket.rooms)

      socket.on("disconnect", () => {
        console.log("a user go out");
      });

    });
  }
}