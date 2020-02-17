// cst
const s3_url = 'https://triangletradeelvintokyo.s3-ap-northeast-1.amazonaws.com/'
function locateToBoard() {
  // locate user to selected board
  let boardname = $('#select-list').val()
  window.location.assign(`/boards/${boardname}`)
};
// To do : made header react to log in status (by changing login div)
if (localStorage.getItem('token')) {
  // Sign in status
  const nickname = localStorage.getItem('nickname');
  $('#navbar-member-link').text(`${nickname}`).attr('href', '/').click(()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
  });
  $('#match-notification').attr('href', `/matches/information?user_nickname=${nickname}`);
  $('#match-confirmed').attr('href', `/matches/confirmed?user_nickname=${nickname}`);
} else {
  $('.fast-btn').attr('href', '/users/signin').click(()=>{
    alert('請先登入或註冊以使用會員功能');
  })
}
$('#notification-area').toggle();

function showNotification() {
  // toggle notification div when click fast-btn
  $('#notification-area').toggle();
}