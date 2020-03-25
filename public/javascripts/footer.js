/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
if (localStorage.getItem('token')) {
  // Sign in status
  const token = localStorage.getItem('token');
  const nickname =$('<div />').attr('style', 'margin-right:14px;')
      .html(localStorage.getItem('nickname'));
  nickname.insertBefore($('.userbar'));
  $('#navbar-member-link').text('登出').attr('href', '/').click(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
  });
  getNotification(token);
  // show red dot
  $('#general-notification').click(() => {
    $('#notification-area').toggle();
    $('.guide').toggle();
    if ($('#notification-count')) {
      // call update user watch_msg_time function**
      updateMsgWatchedTime(token);
      $('#notification-count').remove();
    }
  });
  $('#match-notification').attr('href', '/want/check');
  $('#want-invitation').attr('href', '/want/invitation');
  $('#match-confirmed').attr('href', '/matches/confirmed');
  $('#add-item').attr('href', '/items/new');
  // get notification counts
} else {
  $('#navbar-member-link').click(() => {
    $('#sign-area').show();
    $('.id').trigger('focus');
  });
  $('.fast-btn').click(() => {
    alert('請先登入或註冊以使用會員功能');
  });
}

function getNotification(token) {
  // get notification msg => add page
  $.ajax({
    url: '/api/1.0/message/header',
    type: 'get',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: async (msgArr) => {
      if (msgArr.length > 0) {
        // insert msg into msg area
        msgArr.forEach((msgObj) => {
          // show unread dot
          const link = $('<a />').attr({
            href: msgObj.link,
            class: 'header-msg',
          });
          $('#notification-area').append(link);
          let outerNotificationDiv;
          if (msgObj.watched === 0) { // unread msg
            outerNotificationDiv = $('<div></div>')
                .attr({'class': 'notification-div outer notification new'});
          } else {
            outerNotificationDiv = $('<div></div>')
                .attr({'class': 'notification-div outer notification'});
          }
          link.append(outerNotificationDiv);
          const indentDot = $('<div></div>').attr({'id': 'indent-dot'});
          const notificationDiv = $('<div></div>')
              .attr({'class': 'notification-div new'})
              .html(`${msgObj.content}`);
          outerNotificationDiv.append(indentDot);
          outerNotificationDiv.append(notificationDiv);
          if (msgObj.watched === 0) {
            // 標示為已讀
            link.click(() => {
              $.ajax({ // 要改成針對每個 notification
                url: `/api/1.0/message/watched?id=${msgObj.id}`,
                type: 'post',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                success: () => {
                  outerNotificationDiv
                      .attr({'class': 'notification-div outer notification'});
                },
                error: () => {
                },
              });
            });
          }
        });
        // 顯示新訊息紅點 => 改為比對最新訊息時間與最後觀看時間**
        const lastWatchTime = await getLastMsgWatchedTime(token)
            .catch(() => {});
        if (msgArr[0].create_time > lastWatchTime) {
          const notificationCount = $('<div></div>')
              .attr({'id': 'notification-count'});
          notificationCount.insertAfter($('#notification-span'));
        }
      } else {
        const outerNotificationDiv = $('<div></div>')
            .attr({'class': 'notification-div outer notification'});
        $('#notification-area').append(outerNotificationDiv);
        const notificationDiv = $('<div></div>')
            .attr({'class': 'notification-div new'}).html('現在沒有新訊息喔！');
        $(outerNotificationDiv).append(notificationDiv);
      }
    },
    error: () => {
    },
  });
}

function updateMsgWatchedTime(token) {
  $.ajax({
    url: '/api/1.0/users/watchMsgTime',
    type: 'put',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: () => { },
    error: () => {
    },
  });
}

async function getLastMsgWatchedTime(token) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/api/1.0/users/lastMsgWatchedTime',
      type: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: (time) => {
        resolve(time);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}
