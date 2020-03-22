/* eslint-disable require-atomic-updates */
const { addNewMatchedPageMsg, getConfirmedMatchMsg, getLastestMsg, getInsertedMsgTime } = require('../dao/msgDAO');
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
        .catch(() => {
          const errorMsg = '暫時無法認證您的身份QQ，若持續發生請聯絡我們';
          io.to(socket.id).emit('error', { errorMsg });
        });
      if (confirmedMatchArr.length === 0) {
        const errorMsg = '您目前還沒有成交物品喔～';
        io.to(socket.id).emit('error', { errorMsg });
        return;
      }
      let matchedIdArr = confirmedMatchArr.map(match => `${match.matched_id}`);
      socket.join(matchedIdArr); // 把 socket 加入所屬交易的對話房間(s)
      // 取得每個 match 的最新一筆訊息
      let lastestMsgArr = await getLastestMsg(matchedIdArr).catch(() => { });
      if (confirmedMatchArr && lastestMsgArr) {
        io.to(socket.id).emit('join', { confirmedMatchArr, lastestMsgArr, });
      } else if (confirmedMatchArr) {
        io.to(socket.id).emit('join', { confirmedMatchArr });
      }
    });
    // Get history request
    socket.on('history', async (obj) => {
      // Get history from db
      let checkValidUser = await checkVaildUserOfChat(obj.token, obj.matched_id)
        .catch(() => {
          const errorMsg = '暫時無法認證您的身份QQ，若持續發生請聯絡我們';
          io.to(socket.id).emit('error', { errorMsg });
        });
      if (checkValidUser) {
        // content, sender
        let msgArr = await getConfirmedMatchMsg(obj.matched_id)
          .catch(() => {
            const errorMsg = '暫時無法取得通訊紀錄QQ，若持續發生請聯絡我們';
            io.to(socket.id).emit('error', { errorMsg });
          });
        if (msgArr) {
          // 取得 matched_items_id
          let matchedItemsIdObj = await getConfirmedMatchItemsId(obj.matched_id).catch(() => {
            const errorMsg = '暫時無法取得通訊紀錄QQ，若持續發生請聯絡我們';
            io.to(socket.id).emit('error', { errorMsg });
          });
          if (matchedItemsIdObj) {
            // 整理取得 item Data
            let idArr = Object.values(matchedItemsIdObj);
            let itemDataArr = await getConfirmedMatchItemsData(idArr)
              .catch(() => { });
            if (itemDataArr) {
              io.to(socket.id).emit('history', {
                msgArr,
                itemDataArr,
                curMatch: obj.matched_id,
              });
            }
          }
        }
      }
    });
    // 處理訊息
    socket.on('message', async (obj) => {
      // 確認本人
      let checkUser = await checkVaildUserOfChat(obj.token, obj.matched_id)
        .catch(() => {
          io.to(socket.id).emit('error', {
            errorMsg: '用戶驗證失敗，請重新登入'
          });
        });
      if (checkUser && checkUser.nickname === obj.data.sender) {
        // DB儲存對話
        obj.data.sender = checkUser.id;
        const insertedId = await addNewMatchedPageMsg(obj.data)
          .catch(() => {
            const errorMsg = '儲存訊息失敗><若持續發生請聯絡我們';
            io.to(socket.id).emit('error', { errorMsg });
            console.log('msgAPI did not insert msg correctly');
          });
        obj.data.sender = checkUser.nickname;
        if (insertedId) {
          // 儲存成功後回傳訊息給聊天室
          obj.data.create_time = await getInsertedMsgTime(insertedId)
            .catch(() => { obj.data.create_time = ''; });
          io.to(obj.data.matched_id).emit('message', obj.data);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('a user go out');
    });

  });

}

module.exports = init;