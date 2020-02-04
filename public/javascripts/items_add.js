const token = localStorage.getItem('token');
if (token) {
  $('#token-input').val(token);
} else {
  alert('plz sign in first');
  window.location.assign('/');
}

let initSubCategoryOption = $('<option></option>').attr({
  'value': 'shoes',
  // 'class': 'sub-option',
}).html('Shoes');
$('#sub_category').append(initSubCategoryOption);

function changeSubOption() {
  $('#sub_category').empty();
  if ($('#main_category').val() === 'basketball') {
    let subCategoryOption = $('<option></option>').attr({
      'value': 'shoes',
      // 'class': 'sub-option',
    }).html('Shoes');
    $('#sub_category').append(subCategoryOption)
  } else if ($('#main_category').val() === 'photograph') {
    let subCategoryOption = $('<option></option>').attr({
      'value': 'camera',
      // 'class': 'sub-option',
    }).html('Camera');
    $('#sub_category').append(subCategoryOption)
  }
}