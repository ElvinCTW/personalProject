const token = localStorage.getItem('token');
if (token) {
  $('#token-input').val(token);
} else {
  alert('plz sign in first');
  window.location.assign('/');
}