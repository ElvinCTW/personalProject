/* eslint-disable no-undef */
if (!localStorage.getItem('token')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('請登入以進行物品交換確認');
  window.location.assign('/');
} else {
  const token = localStorage.getItem('token');
  getWantInvitation(token);
}

function getWantInvitation(token) {
  // 取得沒有配對到的 want 紀錄，區分自己和別人的
  $.ajax({
    url: '/api/1.0/want/invitation',
    type: 'get',
    headers: {
      authorization: `Bearer ${token}`,
    },
    success: (data) => {
      // 取得側邊bar items by cur user
      const itemIdArr = Object.keys(data.hashedInvitationArrFromCurUser).concat(Object.keys(data.hashedPosibleInvitationArrToCurUser));
      if (itemIdArr.length > 0) {
        itemIdArr.forEach(id => {
          const itemData = data.hashedDataCollection[id]; // 取得itemData
          let link;
          if (itemData.user_nickname === localStorage.getItem('nickname')) { // 當前用戶的物品, 預設顯示
            link = $('<div></div>').attr('class', 'item-div user-item cur-user').click(() => { //點擊變色
              $('.item-div.user-item.cur-user').attr('style', 'background:none;');
              link.attr('style', 'background:rgb(235,235,235);');
              getMatchedResultData(itemData.id, data, 'curUser');
            });
          } else {
            link = $('<div></div>').attr({ // 非當前用戶物品, 預設不顯示
              class: 'item-div user-item required-user',
              style: 'display:none;',
            }).click(() => { //點擊變色
              $('.item-div.user-item.required-user').attr('style', 'background:none;');
              link.attr('style', 'background:rgb(235,235,235);');
              getMatchedResultData(itemData.id, data, 'requiredUser');
            });
          }
          $('#items-area-user-item').append(link);
          let itemImgDiv = $('<div></div>').attr({ 'class': 'picture-div user-item' });
          let itemContentDiv = $('<div></div>').attr({ 'class': 'content-div user-item' });
          link.append(itemImgDiv);
          link.append(itemContentDiv);
          // add picture
          let itemImg = $('<img></img>').attr({ 'src': s3_url + itemData.pictures.split(',')[0] });
          itemImgDiv.append(itemImg);
          // add title, item-info and tags Divs
          let titleDiv = $('<span></span>').attr({ 'class': 'title user-item' }).html(itemData.title);
          let tagsDiv = $('<div></div>').attr({ 'class': 'introduction-div tags user-item' });
          itemContentDiv.append(titleDiv);
          itemContentDiv.append(tagsDiv);
          // add tags to tagsDiv
          let tagsArr = itemData.tags;
          for (let j = 0; j < tagsArr.length; j++) {
            let tagSpan = $('<div />').attr('class', 'tag user-item').html(`${tagsArr[j]} `);
            tagsDiv.append(tagSpan);
          }
        });
      } else {
        let match = $('<div></div>').attr({
          'class': 'match-container',
          'id': 'no-match-text',
        }).html('目前沒有邀請');
        $('#items-area-match').append(match);
      }
      if ($('.item-div.user-item.cur-user').length > 0) {
        $('.item-div.user-item.cur-user:first').trigger('click');
      }

    },
    error: () => {
      alert('暫時無法為您顯示邀請><若持續發生請通知我們，謝謝！');
    }
  });
}

function getMatchedResultData(item_id, data, item_type) {
  // 取得 matches
  const matchedItemsDataArr = item_type === 'requiredUser' ? data.hashedPosibleInvitationArrToCurUser[item_id] : data.hashedInvitationArrFromCurUser[item_id];
  $('#items-area-match').empty();
  // 畫大框框給每個 match
  for (let i = 0; i < matchedItemsDataArr.length; i++) {
    // 點擊後可以送出配對確認給對方
    let match = $('<div></div>').attr({ 'class': 'match-container' });
    $('#items-area-match').append(match);
    let interaction = $('<div></div>').attr({ 'class': 'match-interaction-container' });
    match.append(interaction);
    if (item_type === 'requiredUser') {
      let interactionBtnDiv = $('<div></div>').attr({ 'class': 'interaction-btn-div' });
      interaction.append(interactionBtnDiv);
      // data for inserting want for CurUser
      let want_items_Arr = matchedItemsDataArr[i].required_item_id.toString(); // cur user item id
      let confirmBtn = $('<button></button>').attr({
        'class': 'interaction-btn',
      }).html('接受邀請').click(() => { // 送出確認請求
        interactionBtnDiv.attr({ 'style': 'display:none;' });
        $.ajax({
          url: '/api/1.0/want/new',
          type: 'post',
          data: {
            'required_item':matchedItemsDataArr[i].want_item_id,
            want_items_Arr,
            'token':localStorage.getItem('token'),
          },
          success: (checkAllConfirmResultArr) => {
            // 若有配對成功，alert 成功訊息
            alert(checkAllConfirmResultArr.msg);
            location.reload();
          },
          error: () => {
            alert('金拍謝，暫時無法為您送出交換邀請，若持續發生請聯繫我們');
          },
        });
      });
      interactionBtnDiv.append(confirmBtn);
    }
    /**
     * 商品資訊區
     */
    // 每個配對的 item 一個框框
    for (let [key, value] of Object.entries(matchedItemsDataArr[i])) {
      let itemData = data.hashedDataCollection[value];
      let link = $('<a></a>').attr({ 'href': `/items/detail?item_id=${itemData.id}` });
      link.insertBefore(interaction);
      // Create new Item outside container
      let newItemContainer_Outside = $('<div></div>').attr({ 'class': 'item-container outside main index' });
      link.append(newItemContainer_Outside);
      // Create new Item inside container
      let newItemContainer_Inside = $('<div></div>').attr({ 'class': 'item-container inside main index' });
      newItemContainer_Outside.append(newItemContainer_Inside);
      // Create basedonDiv, itemImgDiv and itemContentDiv
      let basedonDiv = $('<div></div>').attr({ 'class': 'based-on' });
      let itemImgDiv = $('<div></div>').attr({ 'class': 'item-img main' });
      let itemContentDiv = $('<div></div>').attr({ 'class': 'item content' });
      newItemContainer_Inside.append(basedonDiv);
      newItemContainer_Inside.append(itemImgDiv);
      newItemContainer_Inside.append(itemContentDiv);
      // basedonDiv text spans
      let basedonSpan = $('<span />');
      if (itemData.user_nickname === localStorage.getItem('nickname')) {
        basedonSpan.html('您提供的物品');
      } else {
        if (key === 'middle_item_id') {
          basedonSpan.html('第三人的物品');
        } else {
          basedonSpan.html('您可獲得的物品');
        }
      }
      basedonDiv.append(basedonSpan);
      // add picture
      let itemImg = $('<img></img>').attr({ 'src': s3_url + itemData.pictures.split(',')[0] });
      itemImgDiv.append(itemImg);
      // add title, item-info and tags Divs
      let titleDiv = $('<div></div>').attr({ 'class': 'item title' }).html(`${itemData.title}`);
      let itemInfoDiv = $('<div></div>').attr({ 'class': 'item info' });
      let tagsDiv = $('<div></div>').attr({ 'class': 'item tags' });
      itemContentDiv.append(titleDiv);
      itemContentDiv.append(itemInfoDiv);
      itemContentDiv.append(tagsDiv);
      // add nickname and status span
      let nicknameSpan = $('<span />').attr({ 'class': 'nickname' }).html(`${itemData.user_nickname}`);
      itemInfoDiv.append(nicknameSpan);
      // add tags to tagsDiv
      let tagsArr = itemData.tags;
      for (let j = 0; j < tagsArr.length; j++) {
        let tagSpan = $('<span />').html(`${tagsArr[j]} `);
        tagsDiv.append(tagSpan);
      }
    }
  }

}

$('#search-by-curuser-item').click(() => {
  $('#search-by-curuser-item').attr('style', 'background:rgb(235,235,235);');
  $('#search-by-required-item').attr('style', 'background:none;');
  $('.item-div.user-item.cur-user').attr('style', 'display:flex;background:none;');
  $('.item-div.user-item.required-user').attr('style', 'display:none;background:none;');
  if ($('.item-div.user-item.cur-user').length > 0) {
    $('.item-div.user-item.cur-user:first').trigger('click');
  }
});
$('#search-by-required-item').click(() => {
  $('#search-by-curuser-item').attr('style', 'background:none;');
  $('#search-by-required-item').attr('style', 'background:rgb(235,235,235);');
  $('.item-div.user-item.required-user').attr('style', 'display:flex;background:none;');
  $('.item-div.user-item.cur-user').attr('style', 'display:none;background:none;');
  if ($('.item-div.user-item.required-user').length > 0) {
    $('.item-div.user-item.required-user:first').trigger('click');
  }
});