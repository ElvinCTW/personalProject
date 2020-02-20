if (localStorage.getItem('token')) {
  // Sign in status
  const nickname = localStorage.getItem('nickname');
  $('#navbar-member-link').text(`${nickname}`).attr('href', '/').click(()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
  });
  // show notification
  showNotification(nickname);
  $('#general-notification').click(()=>{
    $('#notification-area').toggle()
    // call msgDAO change watched => true
    if ($('#notification-count').html()) {
      $('#notification-count').remove();
      $.ajax({
        url: `/api/1.0/message/watched?nickname=${nickname}`,
        type: 'post',
        success: (affectedRows) => {
          console.log(affectedRows);
          console.log(`已將 ${affectedRows} 則訊息標示為已讀`);
        },
        error: (err) => {
          console.log(err)
          return;
        }
      })
    }
  })
  $('#match-notification').attr('href', `/matches/information?user_nickname=${nickname}`);
  $('#match-confirmed').attr('href', `/matches/confirmed?user_nickname=${nickname}`);
  $('#add-item').attr('href', `/items/new`);

  // get notification counts
} else {
  $('#navbar-member-link').click(()=>{
    // console.log('asdads');
    $('#sign-area').show();
  });
  $('.fast-btn').click(()=>{
    alert('請先登入或註冊以使用會員功能');
  })
}

function showNotification(nickname) {
  // get notification msg
  $.ajax({
    url: `/api/1.0/message/header?nickname=${nickname}`,
    type: 'get',
    success: (unreadMsgArr) => {
      console.log(unreadMsgArr);
      if (unreadMsgArr.length > 0) {
        // update number of fast btn
        let notificationCount = $('<div></div>').attr({'id': 'notification-count'}).html(`${unreadMsgArr.length}`);
        notificationCount.insertAfter($('#notification-pic'))
        // insert msg into msg area
        unreadMsgArr.forEach(msgObj=>{
          let outerNotificationDiv =$('<div></div>').attr({ 'class': 'notification-div outer notification' });
          $('#notification-area').append(outerNotificationDiv);
          let notificationDiv = $('<div></div>').attr({ 'class': 'notification-div new' }).html(`${msgObj.content}`);
          $(outerNotificationDiv).append(notificationDiv);
        })
      } else {
        let outerNotificationDiv =$('<div></div>').attr({ 'class': 'notification-div outer notification' });
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