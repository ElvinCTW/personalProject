let page = 0;
let nomoreUpdate = false;
let user_nickname = null;
let selectItemIDArr = [];
let lastTimeSelectedArr;
let time = $('#item-detail-time')

time.html(new Date(parseInt(time.html())).toString().slice(4, 21))

/**
 * 創造申請交換用戶物品列表
 */
$('#change-btn-item-detail').click(() => {
  if (!localStorage.getItem('nickname')) {
    // 確認使用者有登入，如果沒有，跳alert請user登入
    alert('請登入以進行物品交換申請');
    return;
  } else if (localStorage.getItem('nickname') === $('#required-owner').html()) {
    // 確認使用者沒對自己的物品進行交換
    alert('請不要和自己交換喔～是在哈囉？');
    return;
  } else {
    if (page !== 'end') {
      $('#subdiv-itemdetail-useritems').attr({ style: '' })
      user_nickname = localStorage.getItem('nickname');
      // 前端發送 ajax，更新現有頁面為申請者所有物品頁面
      $.ajax({
        url: `/api/1.0/want/last?required_item_id=${parseInt(window.location.search.split('=')[1])}&user_nickname=${user_nickname}`,
        type: 'get',
        success: (result) => {
          console.log(result);
          lastTimeSelectedArr = result;
          $.ajax({
            url: `/api/1.0/items/all?page=${page}&user_nickname=${user_nickname}`,
            type: 'get',
            success: (itemsListArr) => {
              // 記得要順便 query wish table，如果 table 有記錄需寫進 lastOfferItems
              for (let i = 6 * page; i < (6 * page + itemsListArr.length); i++) {
                // Create link to item detail page
                let link = $('<div></div>').attr({
                  'class': 'item-container-selector',
                  'item_id': itemsListArr[i - 6 * page].id,
                }).click(() => {
                  if (newItemContainer_Outside.attr('style') === 'background:#ddd') {
                    // 取消點選時將 itemID 移出 selectorListArr
                    newItemContainer_Outside.attr({ 'style': 'background:#fff' });
                    selectItemIDArr.forEach((itemID) => {
                      if (itemID === parseInt(link.attr('item_id'))) {
                        selectItemIDArr.splice(selectItemIDArr.indexOf(itemID), 1);
                      }
                    })
                  } else {
                    // 點選時將 itemID 加入 selectorListArr
                    newItemContainer_Outside.attr({ 'style': 'background:#ddd' });
                    selectItemIDArr.push(parseInt(link.attr('item_id')));
                  }
                });
                $('#items-area-recommand').append(link);
                // Create new Item outside container
                let newItemContainer_Outside
                if (lastTimeSelectedArr.indexOf(itemsListArr[i - 6 * page].id) !== -1) {
                  newItemContainer_Outside = $('<div></div>').attr({
                    'class': 'item-container-outside recommands',
                    'style': 'background:#ddd',
                  });
                } else {
                  newItemContainer_Outside = $('<div></div>').attr({ 'class': 'item-container-outside recommands' });
                }
                link.append(newItemContainer_Outside);
                // Create new Item inside container
                let newItemContainer_Inside = $('<div></div>').attr({ 'class': 'item-container-inside recommands' });
                newItemContainer_Outside.append(newItemContainer_Inside);
                // Create basedonDiv, itemImgDiv and itemContentDiv
                let basedonDiv = $('<div></div>').attr({ 'class': 'based-on' });
                let itemImgDiv = $('<div></div>').attr({ 'class': 'item-img recommands' });
                let itemContentDiv = $('<div></div>').attr({ 'class': 'item content' });
                newItemContainer_Inside.append(basedonDiv);
                newItemContainer_Inside.append(itemImgDiv);
                newItemContainer_Inside.append(itemContentDiv);
                // basedonDiv text spans
                let basedonSpan = $('<span />').html('Based on ');
                let basedontag = $('<span />').attr({ 'id': 'basedon-tag' }).html('#something');
                basedonDiv.append(basedonSpan);
                basedonDiv.append(basedontag);
                // add picture
                let itemImg = $('<img></img>').attr({ 'src': s3_url + itemsListArr[i - 6 * page].pictures.split(',')[0] });
                itemImgDiv.append(itemImg);
                // add title, item-info and tags Divs
                let titleDiv = $('<div></div>').attr({ 'class': 'title' }).html(`${itemsListArr[i - 6 * page].title}`);
                let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
                let tagsDiv = $('<div></div>').attr({ 'class': 'tags' });
                itemContentDiv.append(titleDiv);
                itemContentDiv.append(itemInfoDiv);
                itemContentDiv.append(tagsDiv);
                // add nickname and status span
                let nicknameSpan = $('<span />').attr({ 'class': 'nickname' }).html(`${itemsListArr[i - 6 * page].user_nickname}`);
                let statusSpan = $('<span />').attr({
                  'class': 'status',
                  'id': 'item-status',
                }).html(`${itemsListArr[i - 6 * page].status}`);
                itemInfoDiv.append(nicknameSpan);
                itemInfoDiv.append(statusSpan);
                // add tags to tagsDiv
                let tagsArr = itemsListArr[i - 6 * page].tags.split(' ')
                for (let j = 0; j < tagsArr.length; j++) {
                  let tagSpan = $('<span />').html(`${tagsArr[j]}`);
                  tagsDiv.append(tagSpan);
                }
              }
              if (itemsListArr.length === 6) {
                page += 1;
              } else {
                page = 'end'
              }
            },
            error: (err)=>{
              alert('金拍謝，暫時找不到你的物品資訊QQ，若持續發生請聯繫我們')
              return;
            }
          })
        },
        error: (err) => {
          // alert(err);
          alert('暫時無法找到您上次的交換邀請紀錄')
          return;
        }
      })
    } else {
      if (!nomoreUpdate) {
        nomoreUpdate = true;
        $('#change-btn-item-detail').attr({'onclick': ''}).html('沒有更多物品囉');
      }
    }
  }
})

/**
 * 申請用戶選擇完畢後，點選按鈕送出申請資料
 */
$('#exchange-request-btn').click(() => {
  if (selectItemIDArr.length > 0) {
    // 送出請求 Aajx
    let wantItemArr = selectItemIDArr.filter(id => lastTimeSelectedArr.indexOf(id) === -1);
    if (wantItemArr.length > 0) {
      $.ajax({
        method: 'post',
        url: '/api/1.0/want/new',
        data: {
          'want_items_Arr': wantItemArr.toString(),
          // 'want_items_owner': user_nickname,
          'required_item': parseInt(window.location.search.split('=')[1]),
          // 'required_item_owner': $('#required-owner').html(),
        },
        success: (successMsg) => {
          alert(successMsg.msg);
          location.reload();
        },
        error: (failResponse) => {
          console.log(failResponse);
          // alert(failResponse);
          alert('金拍謝，暫時無法為您添加交換邀請，若持續發生請聯繫我們')
          return;
        }
      })
    } else {
      alert('您本次選擇的物品已在以前選擇過了，請選擇其他物品')
    }
  } else {
    alert('請確認您有選擇新物品後再點選按鈕')
  }
})


let picCount = 0;
let imgLength = $('img').length
$('#img0').attr('style','display:``')

// 點擊換照
$('#item-detail-pic-div').click(()=>{changePic()})
// 輪播照片
window.setInterval(()=>{changePic()}, 3000);
// 換照function
function changePic() {
  $(`#img${picCount%imgLength}`).attr('style','display:none;')
  picCount++
  $(`#img${picCount%imgLength}`).attr('style','display:``')
}