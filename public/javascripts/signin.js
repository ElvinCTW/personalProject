/* eslint-disable no-undef */
if (!localStorage.getItem('token')) {
  console.log('no localstorage, signin');
  // No token, call userSign API
  $('#signin-btn').click(()=>{
    console.log('btn-clicked');
    $.ajax({
      url: '/api/1.0/users/signin',
      type: 'post',
      data: $('#sign-form').serialize(),
      success: (signInResponse)=>{
        if (typeof signInResponse === 'object') {
          console.log(signInResponse);
          localStorage.setItem('token', signInResponse.user.token);
          localStorage.setItem('nickname', signInResponse.user.nickname);
          window.location.assign('/');
        } else {
          alert('查無使用者，或您的登入資訊有誤，請修改後再登入一次');
          return;
        }
      },
      error: ()=>{
        alert('登入有點問題喔，請確認一下，若持續發生請聯絡我們');
        return;
      }
    });
  });
} else {
  // Already sign in, kick user to index page
  window.location.assign('/');
}