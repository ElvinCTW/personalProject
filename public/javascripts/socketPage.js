let currentMatchedId;
socket = io.connect();
/**
 * socket.emit => 送訊息給後端
 * socket.on => 建立監聽事件
 */
// socket.emit('message', 'yo')

/**
 * .emit
 */
// 為 socket 加入房間並讀取歷史訊息
socket.emit('join', {
  token: localStorage.getItem('token'),
})

/**
 * .on
 */
// 收到配對物品清單與資料
socket.on('join', (obj) => {
  console.log(obj.confirmedMatchArr);
  if (obj.confirmedMatchArr.length > 0) {
    // 根據配對數量創造側邊小框
    obj.confirmedMatchArr.forEach(match => {
      let link = $('<div></div>').attr({
        'class': 'item-div user-item',
      }).click(() => {
        $('.item-div.user-item').attr('style', 'background:none;')
        link.attr('style', 'background:rgb(235,235,235);')
        getMatchedResultData(match.matched_id, match.required_item_title);
        $('#gone-item-area').empty();
      });
      $('#items-area-user-item').append(link);
      let itemImgDiv = $('<div></div>').attr({ 'class': 'picture-div user-item' });
      let itemContentDiv = $('<div></div>').attr({ 'class': 'content-div user-item' });
      link.append(itemImgDiv);
      link.append(itemContentDiv);
      // add picture
      let itemImg = $('<img></img>').attr({ 'src': s3_url + match.required_item_pictures.split(',')[0] });
      itemImgDiv.append(itemImg);
      // add title, item-info and tags Divs
      let titleDiv = $('<span></span>').attr({ 'class': 'title user-item' }).html(`${match.required_item_title}`);
      // let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
      let tagsDiv = $('<div></div>').attr({ 'class': 'introduction-div tags user-item' });
      itemContentDiv.append(titleDiv);
      itemContentDiv.append(tagsDiv);
      // add lastest msg into tag div 'class', 'tag user-item'
      let tagSpan = $('<div />').attr({
        class:'tag user-item',
        id:`side-bar-msg-${match.matched_id}`,
      })
      let msg;
      let msgArr = obj.lastestMsgArr.filter(msgObj => msgObj.matched_id === match.matched_id)
      msg = msgArr.length > 0 ? msgArr[0].content : '目前沒有對話喔～';
      tagSpan.html(msg);
      tagsDiv.append(tagSpan);
      // add tags to tagsDiv
      // let tagsArr = match.required_item_tags.split(' ');
      // for (let j = 0; j < tagsArr.length; j++) {
      //   let tagSpan = $('<div />').attr('class', 'tag user-item').html(`${tagsArr[j]} `);
      //   tagsDiv.append(tagSpan);
      // }
    })
    $('.item-div.user-item:first').trigger('click');
  }
})
// 收到歷史訊息
socket.on('history', (confirmedMatchObj) => {
  // history = array of msg obj
  curMatch = confirmedMatchObj.curMatch;
  console.log('收到歷史訊息囉');
  console.log('confirmedMatchObj')
  console.log(confirmedMatchObj)
  if (confirmedMatchObj) {
    // currentMatchedId = matched_id;
    // 清空物品資訊區
    $('#gone-item-area').empty();
    // 根據物品數創造商品資訊框
    for (let i = 0; i < confirmedMatchObj.itemDataArr.length; i++) {
      // Create link to item detail page
      let link = $('<a></a>').attr('href',`/items/gone?item_id=${confirmedMatchObj.itemDataArr[i].id}`);
      $('#gone-item-area').append(link);
      let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-div user-item item-info' });
      link.append(itemInfoDiv);
      // link.append(itemInfoDiv)
      let itemImgDiv = $('<div></div>').attr({ 'class': 'picture-div user-item' });
      let itemContentDiv = $('<div></div>').attr({ 'class': 'content-div user-item item-info' });
      itemInfoDiv.append(itemImgDiv);
      itemInfoDiv.append(itemContentDiv);
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
      if (msg.sender === localStorage.getItem('nickname')) {
        msgDivClass += ' current-user'
        msgLineClass += ' current-user'
      }
      let msgLine = $('<div></div>').attr({ 'class': msgLineClass });
      $('#msg-area').append(msgLine);
      // make msg div and contents inside
      let msgDiv = $('<div></div>').attr({ 'class': msgDivClass });
      msgLine.append(msgDiv);
      let msgTopbar = $('<div></div>').attr({ 'class': 'msg-topbar' });
      console.log('msg.content')
      console.log(msg.content)
      let msgContent = $('<div></div>').attr({ 'class': 'msg-content' }).text(msg.content);
      msgDiv.append(msgTopbar);
      msgDiv.append(msgContent);
      // let msgSpan = $('<span />').html(msg.content);
      // msgContent.append(msgSpan)
      let msgName = $('<div></div>').attr({ 'class': 'msg-name' }).html(msg.sender);
      let msgTime = $('<div></div>').attr({ 'class': 'msg-time' }).html(new Date(parseInt(msg.time)).toString().slice(4, 24));
      msgTopbar.append(msgName);
      msgTopbar.append(msgTime);
    })
    let msgArea = document.getElementById("msg-scroll");
    msgArea.scrollTop = msgArea.scrollHeight;
  }
})
// 收到訊息
socket.on('message', (obj) => {
  if (obj.matched_id === curMatch) { // 送來的訊息是當前對話框，更新大框和側邊小框
    let msgLineClass = 'msg-line'
    let msgDivClass = 'msg-div'
    if (obj.sender === localStorage.getItem('nickname')) {
      msgDivClass += ' current-user'
      msgLineClass += ' current-user'
    }
    // make msg line and append to msg-area
    let msgLine = $('<div></div>').attr({ 'class': msgLineClass });
    $('#msg-area').append(msgLine);
    // make msg div and contents inside
    let msgDiv = $('<div></div>').attr({ 'class': msgDivClass });
    msgLine.append(msgDiv);
    let msgTopbar = $('<div></div>').attr({ 'class': 'msg-topbar current-user' });
    let msgContent = $('<div></div>').attr({ 'class': 'msg-content current-user' }).html(obj.content);
    msgDiv.append(msgTopbar);
    msgDiv.append(msgContent);
    let msgName = $('<div></div>').attr({ 'class': 'msg-name current-user' }).html(obj.sender);
    let msgTime = $('<div></div>').attr({ 'class': 'msg-time current-user' }).html(new Date(obj.time).toString().slice(4, 24));
    msgTopbar.append(msgName);
    msgTopbar.append(msgTime);
    // clean msg after send msg
    $('#user-type-content').val('')
    // auto scroll to bottom
    let msgArea = document.getElementById("msg-scroll");
    msgArea.scrollTop = msgArea.scrollHeight;
  } 
  // 更新側邊小框
  $(`#side-bar-msg-${obj.matched_id}`).html(obj.content);
})

function getMatchedResultData(matched_id, required_item_title) {
  currentMatchedId=matched_id;
  socket.emit('history', {
    matched_id:matched_id,
    token:localStorage.getItem('token'),
  })
}

socket.on('message-fail', (obj)=>{
  alert(obj.errorMsg);
})