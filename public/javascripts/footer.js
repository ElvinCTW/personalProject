let msgCount = 0;
if (localStorage.getItem('token')) {
  // Sign in status
  const nickname = localStorage.getItem('nickname');
  const token = localStorage.getItem('token');
  $('#navbar-member-link').text(`${nickname}`).attr('href', '/').click(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
  });
  // show notification
  showNotification(token);
  $('#general-notification').click(() => {
    $('#notification-area').toggle()
    // call msgDAO change watched => true
    if ($('#notification-count')) {
      $('#notification-count').remove();
      if (msgCount>0) {
        $.ajax({
          url: `/api/1.0/message/watched`,
          type: 'post',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          success: (affectedRows) => {
            console.log(affectedRows);
            console.log(`已將 ${affectedRows} 則訊息標示為已讀`);
            msgCount=0;
          },
          error: (err) => {
            console.log(err)
            return;
          }
        })
      }
    }
  })
  $('#match-notification').attr('href', `/want/check`);
  $('#match-confirmed').attr('href', `/matches/confirmed`);
  $('#add-item').attr('href', `/items/new`);

  // get notification counts
} else {
  $('#navbar-member-link').click(() => {
    // console.log('asdads');
    $('#sign-area').show();
  });
  $('.fast-btn').click(() => {
    alert('請先登入或註冊以使用會員功能');
  })
}

function showNotification(token) {
  // get notification msg
  $.ajax({
    // checkoutRequest.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('stylish_token'))
    url: `/api/1.0/message/header`,
    type: 'get',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: (unreadMsgArr) => {
      console.log(unreadMsgArr);
      if (unreadMsgArr.length > 0) {
        msgCount = unreadMsgArr.length;
        // update number of fast btn
        let notificationCount = $('<div></div>').attr({ 'id': 'notification-count' });
        notificationCount.insertAfter($('#notification-span'))
        // insert msg into msg area
        unreadMsgArr.forEach(msgObj => {
          let outerNotificationDiv = $('<div></div>').attr({ 'class': 'notification-div outer notification' });
          $('#notification-area').append(outerNotificationDiv);
          let notificationDiv = $('<div></div>').attr({ 'class': 'notification-div new' }).html(`${msgObj.content}`);
          $(outerNotificationDiv).append(notificationDiv);
        })
      } else {
        let outerNotificationDiv = $('<div></div>').attr({ 'class': 'notification-div outer notification' });
        $('#notification-area').append(outerNotificationDiv);
        let notificationDiv = $('<div></div>').attr({ 'class': 'notification-div new' }).html(`現在沒有新訊息喔！`);
        $(outerNotificationDiv).append(notificationDiv);
      }
    },
    error: (err) => {
      console.log(err);
    }
  })
}