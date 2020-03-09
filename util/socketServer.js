const { addNewMatchedPageMsg, getConfirmedMatchMsg, getLastestMsg } = require('../dao/msgDAO');
const { getConfirmedMatches, } = require('../dao/item');
const { getConfirmedMatchItemsData } = require('../dao/item');
const { getConfirmedMatchItemsId } = require('../dao/matchDAO');
const { checkVaildUserOfChat } = require('../dao/user');

function init(server) {
  const io = require('socket.io')(server, {
    pingTimeout: 60000,
  });
  /**
   * io.emit => 送廣播給前端
   * socket.on => 監聽 socket 事件
   * message = 訊息事件
   */
  io.on('connection', (socket) => {
    console.log('a user connected');
    // store sockets
    // Get matchedId & matchedItemData & lastest msg
    socket.on('join', async (obj) => {
      let confirmedMatchArr = await getConfirmedMatches(obj.token)
        .catch(err => {  }); // 403
      let matchedIdArr = confirmedMatchArr.map(match => `${match.matched_id}`)
      socket.join(matchedIdArr); // 把 socket 加入所屬交易的對話房間(s)
      // 取得每個 match 的最新一筆訊息
      let lastestMsgArr = await getLastestMsg(matchedIdArr)
      if (confirmedMatchArr && lastestMsgArr) {
        io.to(socket.id).emit('join', {
          confirmedMatchArr: confirmedMatchArr,
          lastestMsgArr: lastestMsgArr,
        })
      }
    })
    // Get history request
    socket.on('history', async (obj) => {
      // Get history from db
      let checkValidUser = await checkVaildUserOfChat(obj.token, obj.matched_id)
        .catch(err => {
          console.log(err.errorMsg);
          alert('暫時無法取得您的身份QQ，若持續發生請聯絡我們')
        })
      if (checkValidUser) {
        // content, sender, time
        let msgArr = await getConfirmedMatchMsg(obj.matched_id)
          .catch((err) => {
            console.log(err.errorMsg);
          });
        if (msgArr) {
          // 取得 matched_items_id
          let matchedItemsIdObj = await getConfirmedMatchItemsId(obj.matched_id).catch((err) => {
            console.log(err.errorMsg);
          });
          if (matchedItemsIdObj) {
            // 整理取得 item Data
            let idArr = Object.values(matchedItemsIdObj)
            let itemDataArr = await getConfirmedMatchItemsData(idArr)
              .catch((err) => {
                console.log(err.errorMsg);
              });
            if (itemDataArr) {
              io.to(socket.id).emit('history', {
                msgArr: msgArr,
                itemDataArr: itemDataArr,
                curMatch: obj.matched_id,
              })
            }
          }
        }
      } else {
        // 403
      }
    })
    // 處理訊息
    socket.on('message', async (obj) => {
      // 確認本人
      console.log('server get emit');
      console.log(obj);
      let checkUser = await checkVaildUserOfChat(obj.token, obj.matched_id)
      // getUserDataByToken(obj.token)
      // if (checkUser.length > 0 && checkUser[0].nickname === obj.data.sender) {
      if (checkUser && checkUser.nickname === obj.data.sender) {
        // DB儲存對話
        let currentTime = Date.now();
        obj.data.time = currentTime;
        // obj.action = 'addNewMatchedPageMsg';
        let affectedRows = await addNewMatchedPageMsg(obj.data);
        if (affectedRows !== 1) {
          io.to(socket.id).emit('message-fail', {
            errorMsg: '用戶驗證失敗，請重新登入'
          })
          console.log('msgAPI did not insert msg correctly');
        } else {
          // 儲存成功後回傳訊息給聊天室
          io.to(obj.data.matched_id).emit('message', obj.data)
        }
      } else {
        console.log('用戶驗證失敗');
        io.to(socket.id).emit('message-fail', {
          errorMsg: '用戶驗證失敗，請重新登入'
        })
      }
    })

    socket.on("disconnect", () => {
      console.log("a user go out");
    });

  });

}

module.exports = init;