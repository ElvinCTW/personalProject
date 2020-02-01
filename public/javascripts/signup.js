if (!localStorage.getItem('token')) {
  console.log('no localstorage');
  // No token, call userSign API
  $('#submit-btn').click(()=>{
    console.log('btn-clicked');
    $.ajax({
      url: '/api/1.0/users/register',
      type: 'post',
      data: $('#sign-form').serialize(),
      success: (insertionResponse)=>{
        localStorage.setItem('token', insertionResponse.user.token);
        localStorage.setItem('nickname', insertionResponse.user.nickname);
        window.location.assign('/');
      },
      error: (failResponse)=>{
        console.log(failResponse.responseText);
        alert(failResponse.responseText);
      }
    })
  })
} else {
  // Already sign in, kick user to index page
  window.location.assign('/');
}