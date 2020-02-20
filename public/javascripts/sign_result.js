let nickname = document.getElementById("nickname").value
let token = document.getElementById("token").value
console.log('token')
console.log(token)
console.log('nickname')
console.log(nickname)
if (nickname !== '' && token !== '') {
  localStorage.setItem('token', token);
  localStorage.setItem('nickname', nickname);
  window.location.assign('/');
} else {
  alert('查無此帳號或輸入資料有誤，請確認後重新登入');
  window.location.assign('/');
}