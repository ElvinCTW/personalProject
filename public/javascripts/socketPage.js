socket = io.connect();
/**
 * socket.emit => 送訊息給後端
 * socket.on => 建立監聽事件
 */
// socket.emit('message', 'yo')

/**
 * .on
 */
// 收到訊息
socket.on('message', (obj) => {
  console.log(obj);
  console.log('得到後端回應');
})
// 收到歷史訊息
socket.on('history', (confirmedMatchObj) => {
  // history = array of msg obj
  console.log('收到歷史訊息囉');
  console.log('confirmedMatchObj')
  console.log(confirmedMatchObj)
  if (confirmedMatchObj) {
    // currentMatchedId = matched_id;
    // 清空物品資訊區
    $('#items-info-div').empty();
    // 根據物品數創造框框
    for (let i = 0; i < confirmedMatchObj.itemDataArr.length; i++) {
      // Create link to item detail page
      // let link = $('<a></a>').attr('href',`/items/detail?item_id=${confirmedMatchObj.itemDataArr[i].id}`);
      // let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
      let link = $('<div></div>').attr({ 'class': 'item-div user-item item-info' });
      $('#items-info-div').append(link);
      // link.append(itemInfoDiv)
      let itemImgDiv = $('<div></div>').attr({ 'class': 'picture-div user-item' });
      let itemContentDiv = $('<div></div>').attr({ 'class': 'content-div user-item item-info' });
      link.append(itemImgDiv);
      link.append(itemContentDiv);
      let itemImg = $('<img></img>').attr({ 'src': s3_url + confirmedMatchObj.itemDataArr[i].pictures.split(',')[0] });
      itemImgDiv.append(itemImg);
      let titleDiv = $('<span></span>').attr({ 'class': 'title user-item item-info' }).html(`${confirmedMatchObj.itemDataArr[i].title}`);
      let tagsDiv = $('<div></div>').attr({ 'class': 'introduction-div tags user-item item-info' }).html(`${confirmedMatchObj.itemDataArr[i].user_nickname}`);
      itemContentDiv.append(titleDiv);
      itemContentDiv.append(tagsDiv);
    }
    $('#msg-area').empty()
    if (confirmedMatchObj.msgArr.length === 0) {
      let msgLine = $('<div></div>').attr({ 'class': 'msg-line' });
      $('#msg-area').append(msgLine);
      let msgDiv = $('<div></div>').attr({ 'class': 'msg-div' });
      msgLine.append(msgDiv);
      let msgContent = $('<div></div>').attr({ 'class': 'msg-content' }).html('目前沒有對話喔，快和對方商量交換細節吧！');
      msgDiv.append(msgContent);
    }
    confirmedMatchObj.msgArr.forEach(msg => {
      let msgLineClass = 'msg-line'
      let msgDivClass = 'msg-div'
      let who;
      if (msg.sender === localStorage.getItem('nickname')) {
        msgDivClass += ' current-user'
        msgLineClass += ' current-user'
        who = '您'
      }
      let msgLine = $('<div></div>').attr({ 'class': msgLineClass });
      $('#msg-area').append(msgLine);
      // make msg div and contents inside
      let msgDiv = $('<div></div>').attr({ 'class': msgDivClass });
      msgLine.append(msgDiv);
      let msgTopbar = $('<div></div>').attr({ 'class': 'msg-topbar' });
      let msgContent = $('<div></div>').attr({ 'class': 'msg-content' }).html(msg.content);
      msgDiv.append(msgTopbar);
      msgDiv.append(msgContent);
      let msgName = $('<div></div>').attr({ 'class': 'msg-name' }).html(who || msg.sender);
      let msgTime = $('<div></div>').attr({ 'class': 'msg-time' }).html(new Date(parseInt(msg.time)).toString().slice(4, 24));
      msgTopbar.append(msgName);
      msgTopbar.append(msgTime);
    })
    let msgArea = document.getElementById("msg-scroll");
    msgArea.scrollTop = msgArea.scrollHeight;
  }
})