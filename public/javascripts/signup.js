if (!localStorage.getItem('token')) {
  console.log('no localstorage');
  // No token, call userSign API
  // $('#submit-btn').click(()=>{
  //   console.log('btn-clicked');
  //   $.ajax({
  //     url: '/api/1.0/users/register',
  //     type: 'post',
  //     data: $('#sign-form').serialize(),
  //     success: (insertionResponse)=>{
  //       console.log(insertionResponse);
  //       console.log(typeof insertionResponse);
  //       if (typeof insertionResponse === 'object') {
  //         localStorage.setItem('token', insertionResponse.user.token);
  //         localStorage.setItem('nickname', insertionResponse.user.nickname);
  //         window.location.assign('/');
  //       } else {
  //         alert('這個ID已被註冊，請修改後再試一次');
  //         return;
  //       }
  //     },
  //     error: (failResponse)=>{
  //       alert('註冊有點問題，請稍後後再試一次，若持續發生請聯繫我們')
  //       return;
  //     }
  //   })
  // })
} else {
  // Already sign in, kick user to index page
  window.location.assign('/');
}