/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
socket = io.connect();

// 將 socket 加入指定房間並讀取歷史訊息
socket.emit('join', {
  token: localStorage.getItem('token'),
});

/**
 * .on
 */
// 接收配對物品清單與資料
socket.on('join', (obj) => {
  if (obj.confirmedMatchArr.length > 0) {
    // 根據配對數量創造側邊小框
    obj.confirmedMatchArr.forEach((match) => {
      const link = $('<div></div>').attr({
        'class': 'item-div user-item',
      }).click(() => {
        $('.item-div.user-item').attr('style', 'background:none;');
        link.attr('style', 'background:rgb(235,235,235);');
        getMatchedResultData(match.matched_id);
        $('#gone-item-area').empty();
      });
      $('#items-area-user-item').append(link);
      const itemImgDiv = $('<div></div>')
          .attr({'class': 'picture-div user-item'});
      const itemContentDiv = $('<div></div>')
          .attr({'class': 'content-div user-item'});
      link.append(itemImgDiv);
      link.append(itemContentDiv);
      // add picture
      const itemImg = $('<img></img>')
          .attr({'src': s3URL + match.required_item_pictures.split(',')[0]});
      itemImgDiv.append(itemImg);
      // add title, item-info and tags Divs
      const titleDiv = $('<span></span>')
          .attr({'class': 'title user-item'})
          .html(`${match.required_item_title}`);
      const tagsDiv = $('<div></div>')
          .attr({'class': 'introduction-div tags user-item'});
      itemContentDiv.append(titleDiv);
      itemContentDiv.append(tagsDiv);
      // add lastest msg into tag div 'class', 'tag user-item'
      const tagSpan = $('<div />').attr({
        class: 'tag user-item',
        id: `side-bar-msg-${match.matched_id}`,
      });
      if (obj.lastestMsgArr) {
        const msgArr = obj.lastestMsgArr
            .filter((msgObj) => msgObj.matched_id === match.matched_id);
        const msg = msgArr.length > 0 ? msgArr[0].content : '目前沒有對話喔～';
        tagSpan.html(msg);
        tagsDiv.append(tagSpan);
      }
    });
    $('.item-div.user-item:first').trigger('click');
  }
});
// 收到歷史訊息
socket.on('history', (confirmedMatchObj) => {
  // history = array of msg obj
  curMatch = confirmedMatchObj.curMatch;
  if (confirmedMatchObj) {
    // currentMatchedId = matched_id;
    // 清空物品資訊區
    $('#gone-item-area').empty();
    // 根據物品數創造商品資訊框
    if (confirmedMatchObj.itemDataArr) {
      let matchers = '';
      for (let i = 0; i < confirmedMatchObj.itemDataArr.length; i++) {
        // Create link to item detail page
        const link = $('<a></a>')
            .attr('href', `/items/gone?item_id=
            ${confirmedMatchObj.itemDataArr[i].id}`);
        $('#gone-item-area').append(link);
        const itemInfoDiv = $('<div></div>')
            .attr({'class': 'item-div user-item item-info'});
        link.append(itemInfoDiv);
        const itemImgDiv = $('<div></div>')
            .attr({'class': 'picture-div user-item'});
        const itemContentDiv = $('<div></div>')
            .attr({'class': 'content-div user-item item-info'});
        itemInfoDiv.append(itemImgDiv);
        itemInfoDiv.append(itemContentDiv);
        const itemImg = $('<img></img>')
            .attr({'src': s3URL +
            confirmedMatchObj.itemDataArr[i].pictures.split(',')[0]});
        itemImgDiv.append(itemImg);
        const titleDiv = $('<span></span>')
            .attr({'class': 'title user-item item-info'})
            .html(`${confirmedMatchObj.itemDataArr[i].title}`);
        const tagsDiv = $('<div></div>')
            .attr({'class': 'introduction-div tags user-item item-info'})
            .html(`${confirmedMatchObj.itemDataArr[i].user_nickname}`);
        itemContentDiv.append(titleDiv);
        itemContentDiv.append(tagsDiv);
        const matcher = i === confirmedMatchObj.itemDataArr.length - 1 ?
        `${confirmedMatchObj.itemDataArr[i].user_nickname} ` :
        `${confirmedMatchObj.itemDataArr[i].user_nickname}, `;
        matchers += matcher;
      }
      $('#matchers').html(matchers);
    }
    // 插入歷史訊息
    $('#msg-area').empty();
    if (confirmedMatchObj.msgArr.length === 0) {
      const msgLine = $('<div></div>').attr({'class': 'msg-line'});
      $('#msg-area').append(msgLine);
      const msgDiv = $('<div></div>').attr({'class': 'msg-div'});
      msgLine.append(msgDiv);
      const msgContent = $('<div></div>')
          .attr({'class': 'msg-content'})
          .html('目前沒有對話喔，快和其他人商量交換細節吧！');
      msgDiv.append(msgContent);
    }
    confirmedMatchObj.msgArr.forEach((msg) => {
      let msgLineClass = 'msg-line';
      let msgDivClass = 'msg-div';
      if (msg.sender === localStorage.getItem('nickname')) {
        msgDivClass += ' current-user';
        msgLineClass += ' current-user';
      }
      const msgLine = $('<div></div>').attr({'class': msgLineClass});
      $('#msg-area').append(msgLine);
      // make msg div and contents inside
      const msgDiv = $('<div></div>').attr({'class': msgDivClass});
      msgLine.append(msgDiv);
      const msgTopbar = $('<div></div>').attr({'class': 'msg-topbar'});
      const msgContent = $('<div></div>')
          .attr({'class': 'msg-content'})
          .text(msg.content);
      msgDiv.append(msgTopbar);
      msgDiv.append(msgContent);
      const msgName = $('<div></div>')
          .attr({'class': 'msg-name'})
          .html(msg.sender);
      const msgTime = $('<div></div>')
          .attr({'class': 'msg-time'})
          .html(msg.create_time);
      msgTopbar.append(msgName);
      msgTopbar.append(msgTime);
    });
    const msgArea = document.getElementById('msg-scroll');
    msgArea.scrollTop = msgArea.scrollHeight;
  }
});
// 收到訊息
socket.on('message', (obj) => {
  console.log(obj);
  if (obj.matched_id === curMatch) { // 送來的訊息是當前對話框，更新大框和側邊小框
    let msgLineClass = 'msg-line';
    let msgDivClass = 'msg-div';
    if (obj.sender === localStorage.getItem('nickname')) {
      msgDivClass += ' current-user';
      msgLineClass += ' current-user';
    }
    // make msg line and append to msg-area
    const msgLine = $('<div></div>').attr({'class': msgLineClass});
    $('#msg-area').append(msgLine);
    // make msg div and contents inside
    const msgDiv = $('<div></div>').attr({'class': msgDivClass});
    msgLine.append(msgDiv);
    const msgTopbar = $('<div></div>')
        .attr({'class': 'msg-topbar current-user'});
    const msgContent = $('<div></div>')
        .attr({'class': 'msg-content current-user'})
        .html(obj.content);
    msgDiv.append(msgTopbar);
    msgDiv.append(msgContent);
    const msgName = $('<div></div>')
        .attr({'class': 'msg-name current-user'})
        .html(obj.sender);
    const msgTime = $('<div></div>')
        .attr({'class': 'msg-time current-user'})
        .html(obj.create_time);
    msgTopbar.append(msgName);
    msgTopbar.append(msgTime);
    // clean msg after send msg
    $('#user-type-content').val('');
    // auto scroll to bottom
    const msgArea = document.getElementById('msg-scroll');
    msgArea.scrollTop = msgArea.scrollHeight;
  }
  // 更新側邊小框
  $(`#side-bar-msg-${obj.matched_id}`).html(obj.content);
});

function getMatchedResultData(matchedId) {
  currentMatchedId = matchedId;
  socket.emit('history', {
    matched_id: matchedId,
    token: localStorage.getItem('token'),
  });
}

socket.on('error', (obj) => {
  alert(obj.errorMsg);
});
