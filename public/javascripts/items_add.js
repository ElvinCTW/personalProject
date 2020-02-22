/**
 * To do :
 * 動態生成母分類
 * 更換主分類時動態生成子分類
 * 上傳時確認暱稱與 token 為同一人
 */
// 生成母分類
$.ajax({
  url: `/api/1.0/category/main`,
  type: 'get',
  success: (mainList) => {
    console.log(mainList);
    mainList.forEach(main=>{
      console.log('main')
      console.log(main)
      let option = $('<div></div>').attr('class', 'option').html(main.main_category)
      $('#main_category_list').append(option);
    })
  },
  error: (err) => {
    alert(err.errorMsg);
  }
})

// 塞token
const token = localStorage.getItem('token');
if (token) {
  $('#token-input').val(token);
} else {
  alert('plz sign in first');
  window.location.assign('/');
}
// 顯示上傳圖片
function readURL(input) {
  for (let i = 0; i < input.files.length; i++) {
    const reader = new FileReader();
    if (input.files && input.files[0]) {
      reader.onload = function (e) {
        // for (let i = 0; i < input.files.length; i++) {
        $(`#pic${i}`).attr('src', e.target.result);
      }
    }
    reader.readAsDataURL(input.files[i]);
  }
}
$("#pics-input").change(function () {
  $('.item-add-pictures').attr('src', '');
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
  // 上傳前確認(pic)
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
// 打開分類選單
$('#main_category').click(()=>{
  $('#main_category_box').toggle();
})
$('#sub_category').click(()=>{
  $('#sub_category_box').toggle()
})
$('#status').click(()=>{
  $('#status_box').toggle()
})

// 點擊主分類選單
$('#main_category_list').click((e)=>{
  $('#main_category_text').text(`${e.toElement.innerText}`)
  $('#main_category_input').val(`${e.toElement.innerText}`);
  // 抽換次分類
  $.ajax({
    url: `/api/1.0/category/sub?main_category=${e.toElement.innerText}`,
    type: 'get',
    success: (subCategorylist) => {
      console.log(subCategorylist);
      $('#sub_category_list').empty()
      subCategorylist.forEach(sub=>{
        let option = $('<div></div>').attr('class','option').html(sub.sub_category);
        $('#sub_category_list').append(option)
      })
    },
    error: (err) => {
      alert(err);
    }
  })
  if ($('#status_input').val() !== '' && $('#sub_category_input').val() !== '') {
    $('#add-items-btn').attr({type:'submit'})
  }
})
// 次分類
$('#sub_category_list').click((e)=>{
  if ($('#main_category_input').val()==='') {
    alert('請先選擇主分類')
  } else {
    $('#sub_category_text').text(`${e.toElement.innerText}`)
    $('#sub_category_input').val(`${e.toElement.innerText}`)
    if ($('#status_input').val() !== '' && $('#main_category_input').val() !== '') {
      $('#add-items-btn').attr({type:'submit'})
    }
  }
})
// 狀態
$('#status_list').click((e)=>{
  $('#status_text').text(`${e.toElement.innerText}`)
  $('#status_input').val(`${e.toElement.innerText}`);
  if ($('#main_category_input').val() !== '' && $('#sub_category_input').val() !== '') {
    $('#add-items-btn').attr({type:'submit'})
  }
})

// 上傳前檢查
$('#add-items-btn').click(()=>{
  if ($('#main_category_input').val() === '' || $('#sub_category_input').val() === ''  || $('#status_input').val() === '') {
    alert('請先選擇商品分類與商品狀態');
  } else if ($('#pics-input').val() === '') {
    alert('請先選擇至少一張圖片');
  }
})
// tag部分排除一些基本輸入錯誤
function tagsNormalization() {
  // let tags = $('#tags_input').val()
  if ($('#tags_input').val() !== '') {
    // 去除空白
    let tags = $('#tags_input').val().replace(/\s*/g,'')
    // 抽換＃為#
    tags = tags.replace(/＃/g,'#')
    $('#tags_input').val(tags)
  }
}