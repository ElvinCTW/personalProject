const nickname = document.getElementById('nickname').value;
const token = document.getElementById('token').value;
const errorMsg = document.getElementById('errorMsg');
if (errorMsg) {
  alert(errorMsg.value);
  window.location.assign('/users/signup');
} else if (nickname !== '' && token !== '') {
  localStorage.setItem('token', token);
  localStorage.setItem('nickname', nickname);
  window.location.assign('/');
} else {
  alert('查無此帳號或輸入資料有誤，請確認後重新登入');
  window.location.assign('/');
}
