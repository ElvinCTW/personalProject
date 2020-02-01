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
        localStorage.setItem('token', signInResponse.user.token);
        localStorage.setItem('nickname', signInResponse.user.nickname);
        window.location.assign('/');
      },
      error: ()=>{
        alert('sign in user ajax error');
      }
    })
  })
} else {
  // Already sign in, kick user to index page
  window.location.assign('/');
}