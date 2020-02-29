const token = localStorage.getItem('token');
if (token) {
  $('#token-input').val(token);
} else {
  alert('plz sign in first');
  window.location.assign('/');
}

/**
 * 互動左側
 */
// 顯示上傳成功訊息
if (localStorage.getItem('newItem')) {
  console.log(localStorage.getItem('newItem'));
  alert(localStorage.getItem('newItem'));
  localStorage.removeItem('newItem');
}
// 註冊分類開關
$('#main_category').click(() => {
  $('#main_category_box').toggle();
})
$('#sub_category').click(() => {
  $('#sub_category_box').toggle()
})
$('#status').click(() => {
  $('#status_box').toggle()
})
// 進入頁面自動點擊主分類
$('#main_category').trigger('click');
// 取得母分類資料
$.ajax({
  url: `/api/1.0/category/item_insertion/main`,
  type: 'get',
  success: (mainList) => {
    mainList.forEach(main => {
      let option = $('<div></div>').attr({
        class: 'option',
        main_id: main.id,
      }).html(main.main_category)
      $('#main_category_list').append(option);
    })
  },
  error: (err) => {
    alert(err.errorMsg);
  }
})
// 更新主分類 & 主分類選擇
$('#main_category_list').click((e) => {
  // console.log('e')
  // console.log(e)
  $('#main_category_text').text(`${e.toElement.innerText}`)
  $('#main_category_input').val(`${e.originalEvent.toElement.attributes.main_id.value}`);
  // 取得次分類資料
  $.ajax({
    url: `/api/1.0/category/item_insertion/sub?main_category=${e.originalEvent.toElement.attributes.main_id.value}`,
    type: 'get',
    success: (subCategorylist) => {
      console.log(subCategorylist);
      $('#sub_category_list').empty()
      $('#sub_category_text').text('次分類   ▾')
      subCategorylist.forEach(sub => {
        let option = $('<div></div>').attr({
          class: 'option',
          sub_id: sub.id
        }).html(sub.sub_category);
        $('#sub_category_list').append(option)
      })
      $('#sub_category').trigger('click');
    },
    error: (err) => {
      alert(err);
    }
  })
  if ($('#status_input').val() !== '' && $('#sub_category_input').val() !== '') {
    $('#add-items-btn').attr({ type: 'submit' })
  }
})
// 更新次分類 & 次分類選擇
$('#sub_category_list').click((e) => {
  if ($('#main_category_input').val() === '') {
    alert('請先選擇主分類')
  } else {
    $('#sub_category_text').text(`${e.toElement.innerText}`)
    $('#sub_category_input').val(`${e.originalEvent.toElement.attributes.sub_id.value}`)
    if ($('#status_input').val() !== '' && $('#main_category_input').val() !== '') {
      $('#add-items-btn').attr({ type: 'submit' })
    }
    $('#status').trigger('click');
  }
})
// 狀態選擇
$('#status_list').click((e) => {
  $('#status_text').text(`${e.toElement.innerText}`)
  $('#status_input').val(`${e.toElement.innerText}`);
  // 自動 focus 標題輸入框
  $('#title_input').trigger('focus');
  if ($('#main_category_input').val() !== '' && $('#sub_category_input').val() !== '') {
    $('#add-items-btn').attr({ type: 'submit' })
  }
})
// autoFocus & click 
$('#title_input').change(() => {
  $('#tags_input').trigger('focus');
})
$('#introduction_input').change(() => {
  $('#pics-input').trigger('click');
})
// tag部分排除基本輸入錯誤
function tagsNormalization() {
  // let tags = $('#tags_input').val()
  if ($('#tags_input').val() !== '') {
    // 抽換＃為#
    let tags = $('#tags_input').val().replace(/＃/g, '#')
    // 去除空白
    tags = tags.replace(/\s*/g, '')
    // 若沒#，添加#
    if (tags[0] !== '#') { tags = '#' + tags }
    // 填上空白+去頭
    tags = tags.replace(/#/g, ' #')
    tags = tags.substr(1)
    $('#tags_input').val(tags)
    // 自動 focus introduction area
    $('#introduction_input').trigger('focus');
  }
}
/**
 * 互動右側
 */
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
// 檢查圖片限制
let vaildImageUpload = true;
// check images size
$('#pics-input').bind('change', function () {
  $('#plus-icon').attr('style', 'display:none;')
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
  // 正確上傳圖片後開放上傳
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
// 上傳前檢查輸入
$('#add-items-btn').click(() => {
  if ($('#main_category_input').val() === '' || $('#sub_category_input').val() === '' || $('#status_input').val() === '') {
    alert('請先選擇商品分類與商品狀態');
  } else if ($('#pics-input').val() === '') {
    alert('請先選擇至少一張圖片');
  }
})
// 避免重複按鍵上傳
const form = document.getElementById('add-items-form')
form.addEventListener('submit', () => {
  $('#add-items-btn').attr({
    type: 'button',
    background: 'rgba(20,59,81,0.5)'
  }).html('上傳中');
})
// 選擇圖片後自動上傳
$('#pics-input').change(() => {
  // event.preventDefault();
  $('#add-items-btn').trigger('click');
})