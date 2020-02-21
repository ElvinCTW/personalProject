/**
 * To do :
 * 更換主分類時動態生成子分類
 * items_add.pug 做出子分類框
 */

const token = localStorage.getItem('token');
if (token) {
  $('#token-input').val(token);
} else {
  alert('plz sign in first');
  window.location.assign('/');
}

function readURL(input) {
  for (let i = 0; i < input.files.length; i++) {
    const reader = new FileReader();
    if (input.files && input.files[0]) {
      reader.onload = function (e) {
        console.log(e);
        console.log('e.target.result')
        console.log(e.target.result)
        // for (let i = 0; i < input.files.length; i++) {
        $(`#pic${i}`).attr('src', e.target.result);
      }
    }
    reader.readAsDataURL(input.files[i]);
  }
}

$("#pics-input").change(function () {
  readURL(this);
});

function changeSubOption() {
  console.log('change');
  // $('#sub_category').empty();
  // if ($('#main_category').val() === 'basketball') {
  //   let subCategoryOption = $('<div></div>').attr({
  //     'value': 'shoes',
  //     // 'class': 'sub-option',
  //   }).html('鞋');
  //   $('#sub_category_list').append(subCategoryOption)
  // } else if ($('#main_category').val() === 'photograph') {
  //   let subCategoryOption = $('<option></option>').attr({
  //     'value': 'camera',
  //     // 'class': 'sub-option',
  //   }).html('相機');
  //   $('#sub_category').append(subCategoryOption)
  // }
}

let vaildImageUpload = true;
// check images size
$('#pics-input').bind('change', function () {
  // check files count
  let files = this.files;
  if (files.length > 4) {
    vaildImageUpload = false;
    alert('圖片超過4張，請減少圖片數量')
  } else {
    // check each picture size
    vaildImageUpload = true;
    for (let i = 0; i < files.length; i++) {
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

$('#main_category_list').click((e)=>{
  $('#main_category_text').text(`${e.toElement.innerText}`)
  $('#main_category_input').val(`${e.toElement.innerText}`);
  if ($('#status_input').val() !== '' && $('#sub_category_input').val() !== '') {
    $('#add-items-btn').attr({type:'submit'})
  }
})
$('#sub_category_list').click((e)=>{
  $('#sub_category_text').text(`${e.toElement.innerText}`)
  $('#sub_category_input').val(`${e.toElement.innerText}`)
  if ($('#status_input').val() !== '' && $('#main_category_input').val() !== '') {
    $('#add-items-btn').attr({type:'submit'})
  }
})
$('#status_list').click((e)=>{
  $('#status_text').text(`${e.toElement.innerText}`)
  $('#status_input').val(`${e.toElement.innerText}`);
  if ($('#main_category_input').val() !== '' && $('#sub_category_input').val() !== '') {
    $('#add-items-btn').attr({type:'submit'})
  }
})

$('#main_category').click(()=>{
  $('#main_category_box').toggle();
})
$('#sub_category').click(()=>{
  $('#sub_category_box').toggle()
})
$('#status').click(()=>{
  $('#status_box').toggle()
})

$('#add-items-btn').click(()=>{
  if ($('#main_category_input').val() === '' || $('#status_input').val() === '') {
    alert('請先選擇商品分類與商品狀態');
  } else if ($('#pics-input').val() === '') {
    alert('請先選擇至少一張圖片');
  }
})

function tagsNormalization() {
  // let tags = $('#tags_input').val()
  if ($('#tags_input').val() !== '') {
    // 去除空白
    let tags = $('#tags_input').val().replace(/\s*/g,'')
    // 抽換＃為#
    tags = tags.replace(/＃/g,'#')
    console.log('tags')
    console.log(tags)
    $('#tags_input').val(tags)
  }
}