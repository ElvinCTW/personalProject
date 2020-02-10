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
  $('#navbar-member-link').text(`${nickname}`).attr('href', '').click(()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
  });
  $('#match-notification').attr('href', `/matches/information?user_nickname=${nickname}`);
}