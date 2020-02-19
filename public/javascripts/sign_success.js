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
  alert('登入有誤，請重新登入');
  window.location.assign('/');
}