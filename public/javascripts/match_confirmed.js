let currentMatchedId;
// const alphabetArr = ['A', 'B', 'C']
if (!localStorage.getItem('token')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('請登入以進入交換討論頁面');
  window.location.assign('/');
  // 應確認使用者為指定 user_nickname 的使用者
} else {
  let token = localStorage.getItem('token');
  $.ajax({
    url: `/api/1.0/matches/list`,
    type: 'get',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: (confirmedMatchArr) => {
      console.log(confirmedMatchArr);
      if (confirmedMatchArr.length > 0) {
        confirmedMatchArr.forEach(match => {
          let link = $('<div></div>').attr({
            'class': 'item-div user-item',
          }).click(() => {
            $('.item-div.user-item').attr('style', 'background:none;')
            link.attr('style', 'background:rgb(235,235,235);')
            getMatchedResultData(match.matched_id, match.required_item_title);
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
          // add tags to tagsDiv
          let tagsArr = match.required_item_tags.split(' ');
          for (let j = 0; j < tagsArr.length; j++) {
            let tagSpan = $('<div />').attr('class', 'tag user-item').html(`${tagsArr[j]} `);
            tagsDiv.append(tagSpan);
          }
        })
      }
    },
    error: (err) => {
      console.log(JSON.parse(err.responseText).errorMsg)
      alert('暫時無法取得戰利品清單QQ，若持續發生請聯絡我們')
      // alert(err.errorMsg);
    }
  })
}

function getMatchedResultData(matched_id, required_item_title) {
  socket.emit('history', {
    matched_id:matched_id,
    token:localStorage.getItem('token'),
  })
  // $.ajax({
  //   url: `/api/1.0/matches/confirmed?matched_id=${matched_id}`,
  //   type: 'get',
  //   headers: {
  //     Authorization: `Bearer ${localStorage.getItem('token')}`,
  //   },
  //   success: (confirmedMatchObj) => {
  //     currentMatchedId = matched_id;
  //     // 清空物品資訊區
  //     $('#items-info-div').empty();
  //     // 根據物品數創造框框
  //     for (let i = 0; i < confirmedMatchObj.itemDataArr.length; i++) {
  //       // Create link to item detail page
  //       // let link = $('<a></a>').attr('href',`/items/detail?item_id=${confirmedMatchObj.itemDataArr[i].id}`);
  //       // let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
  //       let link = $('<div></div>').attr({ 'class': 'item-div user-item item-info' });
  //       $('#items-info-div').append(link);
  //       // link.append(itemInfoDiv)
  //       let itemImgDiv = $('<div></div>').attr({ 'class': 'picture-div user-item' });
  //       let itemContentDiv = $('<div></div>').attr({ 'class': 'content-div user-item item-info' });
  //       link.append(itemImgDiv);
  //       link.append(itemContentDiv);
  //       let itemImg = $('<img></img>').attr({ 'src': s3_url + confirmedMatchObj.itemDataArr[i].pictures.split(',')[0] });
  //       itemImgDiv.append(itemImg);
  //       let titleDiv = $('<span></span>').attr({ 'class': 'title user-item item-info' }).html(`${confirmedMatchObj.itemDataArr[i].title}`);
  //       let tagsDiv = $('<div></div>').attr({ 'class': 'introduction-div tags user-item item-info' }).html(`${confirmedMatchObj.itemDataArr[i].user_nickname}`);
  //       itemContentDiv.append(titleDiv);
  //       itemContentDiv.append(tagsDiv);
  //     }
  //     /**
  //      * 配置對話框
  //      */
  //     // make msg line and append to msg-area
  //     // $('#msg-area').empty()
  //     // if (confirmedMatchObj.msgArr.length === 0) {
  //     //   let msgLine = $('<div></div>').attr({ 'class': 'msg-line' });
  //     //   $('#msg-area').append(msgLine);
  //     //   let msgDiv = $('<div></div>').attr({ 'class': 'msg-div' });
  //     //   msgLine.append(msgDiv);
  //     //   let msgContent = $('<div></div>').attr({ 'class': 'msg-content' }).html('目前沒有對話喔，快和對方商量交換細節吧！');
  //     //   msgDiv.append(msgContent);
  //     // }
  //     // confirmedMatchObj.msgArr.forEach(msg => {
  //     //   let msgLineClass = 'msg-line'
  //     //   let msgDivClass = 'msg-div'
  //     //   let who;
  //     //   if (msg.sender === localStorage.getItem('nickname')) {
  //     //     msgDivClass += ' current-user'
  //     //     msgLineClass += ' current-user'
  //     //     who = '您'
  //     //   }
  //     //   let msgLine = $('<div></div>').attr({ 'class': msgLineClass });
  //     //   $('#msg-area').append(msgLine);
  //     //   // make msg div and contents inside
  //     //   let msgDiv = $('<div></div>').attr({ 'class': msgDivClass });
  //     //   msgLine.append(msgDiv);
  //     //   let msgTopbar = $('<div></div>').attr({ 'class': 'msg-topbar' });
  //     //   let msgContent = $('<div></div>').attr({ 'class': 'msg-content' }).html(msg.content);
  //     //   msgDiv.append(msgTopbar);
  //     //   msgDiv.append(msgContent);
  //     //   let msgName = $('<div></div>').attr({ 'class': 'msg-name' }).html(who || msg.sender);
  //     //   let msgTime = $('<div></div>').attr({ 'class': 'msg-time' }).html(new Date(parseInt(msg.time)).toString().slice(4, 24));
  //     //   msgTopbar.append(msgName);
  //     //   msgTopbar.append(msgTime);
  //     // })
  //     // let msgArea = document.getElementById("msg-scroll");
  //     // msgArea.scrollTop = msgArea.scrollHeight;
  //   },
  //   error: (err) => {
  //     alert('金拍謝，暫時找不到這筆配對紀錄QQ，若持續發生請聯繫我們')
  //     return;
  //   }
  // })
}

function sendMsg() {
  // get user input msg
  let userInputContent = $('#user-type-content').val();
  let currentTime = Date.now();
  // send msg to front end page
  if (userInputContent.length > 0 && currentMatchedId) {
    console.log('userInputContent')
    console.log(userInputContent)
    // make msg line and append to msg-area
    let msgLine = $('<div></div>').attr({ 'class': 'msg-line current-user' });
    $('#msg-area').append(msgLine);
    // make msg div and contents inside
    let msgDiv = $('<div></div>').attr({ 'class': 'msg-div current-user' });
    msgLine.append(msgDiv);
    let msgTopbar = $('<div></div>').attr({ 'class': 'msg-topbar current-user' });
    let msgContent = $('<div></div>').attr({ 'class': 'msg-content current-user' }).html(userInputContent);
    msgDiv.append(msgTopbar);
    msgDiv.append(msgContent);
    let msgName = $('<div></div>').attr({ 'class': 'msg-name current-user' }).html('您');
    let msgTime = $('<div></div>').attr({ 'class': 'msg-time current-user' }).html(new Date(currentTime).toString().slice(4, 24));
    msgTopbar.append(msgName);
    msgTopbar.append(msgTime);
    // clean msg after send msg
    $('#user-type-content').val('')
    // auto scroll to bottom
    let msgArea = document.getElementById("msg-scroll");
    msgArea.scrollTop = msgArea.scrollHeight;
    // save msg into DB
    $.ajax({
      url: `/api/1.0/message/new`,
      type: 'post',
      data: {
        action: 'addNewMatchedPageMsg',
        content: userInputContent,
        sender: localStorage.getItem('nickname'),
        time: currentTime,
        matched_id: currentMatchedId,
      },
      success: (success) => {
        if (success.errorMsg) {
          alert(success.errorMsg)
        } else {
          console.log(success.msg);
        }
      },
      error: (err) => {
        alert('很抱歉，系統沒有成功儲存您的對話QQ，若持續發生請聯繫我們');
      }
    })
  } else {
    alert('請確認已點選左方配對物，並填入對話內容')
  }
}
let infoBtn = $('#items-info-btn')
infoBtn.click(()=>{
  if ($('.item-info').length > 0) {
    if (infoBtn.attr('style')==='background:rgb(235,235,235)') {
      $('#items-info-btn').attr('style','background:none');
    } else {
      $('#items-info-btn').attr('style','background:rgb(235,235,235)');
    }
    // 點擊後變色
    // 點擊後開關 items-info-div
    $('#items-info-div').toggle();
  } else {
    alert('請先選擇對話～')
  }
})