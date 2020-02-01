// To do : made header react to log in status (by changing login div)
if (localStorage.getItem('token')) {
  // Sign in status
  const nickname = localStorage.getItem('nickname');
  $('#navbar-member-link').text(`${nickname}`).attr('href', '').click(()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
  });
}