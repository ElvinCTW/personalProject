/* eslint-disable no-undef */
if (!localStorage.getItem('token')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('請登入以進入交換討論頁面');
  window.location.assign('/');
}

$('#send-msg-btn').click(() => {
  sendMsg();
});

function sendMsg() {
  // get user input msg
  let userInputContent = $('#user-type-content').val();
  // send msg to front end page
  if (userInputContent.length > 0 && currentMatchedId) {
    socket.emit('message', {
      token: localStorage.getItem('token'),
      matched_id: currentMatchedId,
      data: {
        content: userInputContent,
        sender: localStorage.getItem('nickname'),
        matched_id: currentMatchedId,
      }
    });
  } else {
    alert('請確認已點選左方配對物，並填入對話內容');
    $('#user-type-content').val('');
  }
}
let infoBtn = $('#items-info-btn');
infoBtn.click(() => {
  if ($('.item-info').length > 0) {
    if (infoBtn.attr('style') === 'background:rgb(235,235,235)') {
      infoBtn.attr('style', 'background:none').html('顯示成交物品');
    } else {
      infoBtn.attr('style', 'background:rgb(235,235,235)').html('隱藏成交物品');
    }
    // 點擊後變色
    // 點擊後開關 items-info-div
    $('#gone-item-area').toggle();
  } else {
    alert('請先選擇對話～');
  }
});
// textarea 點擊 enter 自動送出
$('#user-type-content').keypress(function (e) {
  if (e.which == 13 && !e.shiftKey) {
    $('#send-msg-btn').trigger('click');
  }
});