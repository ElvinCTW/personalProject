const token = localStorage.getItem('token');
if (token) {
  $('#token-input').val(token);
  // $('#add-items-btn').click(()=>{
  //   console.log('btn-clicked');
  //   $.ajax({
  //     url: '/api/1.0/items/add',
  //     type: 'post',
  //     data: $('#add-items-form').serialize(),
  //     success: (insertionResponse)=>{
  //       window.location.assign('/');
  //     },
  //     error: (failResponse)=>{
  //       console.log(failResponse.responseText);
  //       alert(failResponse.responseText);
  //     }
  //   })
  // })
} else {
  alert('plz sign in first');
  window.location.assign('/');
}