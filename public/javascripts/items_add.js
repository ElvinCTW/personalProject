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
}).html('鞋');
$('#sub_category').append(initSubCategoryOption);

function changeSubOption() {
  $('#sub_category').empty();
  if ($('#main_category').val() === 'basketball') {
    let subCategoryOption = $('<option></option>').attr({
      'value': 'shoes',
      // 'class': 'sub-option',
    }).html('鞋');
    $('#sub_category').append(subCategoryOption)
  } else if ($('#main_category').val() === 'photograph') {
    let subCategoryOption = $('<option></option>').attr({
      'value': 'camera',
      // 'class': 'sub-option',
    }).html('相機');
    $('#sub_category').append(subCategoryOption)
  }
}

let vaildImageUpload = true;
// check images size
$('#pics-input').bind('change', function() {
  // check files count
  let files = this.files;
  if (files.length > 3) {
    vaildImageUpload = false;
    alert('圖片超過3張，請減少圖片數量')
  } else {
    // check each picture size
    vaildImageUpload = true;
    for (let i=0;i<files.length;i++) {
      console.log('files[i].size')
      console.log(files[i].size)
      if (files[i].size > 3000000) {
        vaildImageUpload = false;
        alert(`${files[i].name}的檔案大小超過 3MB ，請取消選用或更換其他圖片`)
      }
    }
  }

  if (vaildImageUpload) {
    $('#add-items-btn').attr({
      'id': 'add-items-btn',
      'type': 'submit',
      'onclick': '',
    })
  } else {
    $('#add-items-btn').attr({
      'id': 'add-items-btn',
      'type': 'button',
      'onclick': 'alert("請先處理上傳圖片問題")'
    })
  }
});