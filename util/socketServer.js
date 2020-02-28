const msgDAO = require('../dao/msgDAO');
const itemDAO = require('../dao/item');
const matchDAO = require('../dao/matchDAO');

module.exports = {
  init: (server)=>{
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
      // Get msg
      socket.on('message', (obj)=>{
        // emit到所有user
        console.log(obj);
        io.emit('message', obj)
        // 儲存到db
    
      })
      // Get history request
      socket.on('history', async (obj)=>{
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

      
    
      socket.on("disconnect", () => {
        console.log("a user go out");
      });
    
    });
  }
}