/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
if (!localStorage.getItem('token')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('請登入以進行物品交換確認');
  window.location.assign('/');
} else {
  const token = localStorage.getItem('token');
  ((token) => {
    // 取得配對物品清單
    $.ajax({
      url: '/api/1.0/want/check', // 會拿到所有的資料,不用再 query 了,點選側邊列時隱藏無關資訊即可
      type: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: (matchResultObj) => {
        // item_id 指的是 user_item_id, 不是想要的 id
        console.log(matchResultObj);
        // let bArr = matchResultObj.b_itemObjectArr
        // 取得"用自身物品查詢"清單
        const curUserItemArr = [];
        matchResultObj.doubleMatchResultArr.forEach((match) => {
          const userItemId = match.curUserWant.item_id;
          if (curUserItemArr.indexOf(userItemId) === -1) {
            curUserItemArr.push(userItemId);
          }
        });
        matchResultObj.tripleMatchResultArr.forEach((match) => {
          const userItemId = match.curUserWant.item_id;
          if (curUserItemArr.indexOf(userItemId) === -1) {
            curUserItemArr.push(userItemId);
          }
        });
        // 取得"用想要物品查詢"清單
        const requiredItemArr = [];
        matchResultObj.doubleMatchResultArr.forEach((match) => {
          const userItemId = match.secondUserWant.item_id;
          if (requiredItemArr.indexOf(userItemId) === -1) {
            requiredItemArr.push(userItemId);
          }
        });
        matchResultObj.tripleMatchResultArr.forEach((match) => {
          const userItemId = match.secondUserWant.item_id;
          if (requiredItemArr.indexOf(userItemId) === -1) {
            requiredItemArr.push(userItemId);
          }
        });
        // 前端渲染側邊訊息Bar
        if (requiredItemArr.length > 0 || curUserItemArr > 0) {
          const itemIdArr = requiredItemArr.concat(curUserItemArr);
          itemIdArr.forEach((id) => {
            const itemData = matchResultObj.itemsDataArr
                .filter((data) => data.id === id)[0]; // 取得itemData
            // 渲染
            let link;
            if (itemData.user_nickname ===
              localStorage.getItem('nickname')) { // 當前用戶的物品, 預設顯示
              link = $('<div></div>')
                  .attr('class', 'item-div user-item cur-user')
                  .click(() => { // 點擊變色
                    $('.item-div.user-item.cur-user')
                        .attr('style', 'background:none;');
                    link.attr('style', 'background:rgb(235,235,235);');
                    getMatchedResultData(
                        itemData.id, matchResultObj, 'curUser',
                    );
                  });
            } else {
              link = $('<div></div>').attr({ // 非當前用戶物品, 預設不顯示
                class: 'item-div user-item required-user',
                style: 'display:none;',
              }).click(() => { // 點擊變色
                $('.item-div.user-item.required-user')
                    .attr('style', 'background:none;');
                link.attr('style', 'background:rgb(235,235,235);');
                getMatchedResultData(
                    itemData.id, matchResultObj, 'requiredUser',
                );
              });
            }
            $('#items-area-user-item').append(link);
            const itemImgDiv = $('<div></div>')
                .attr({'class': 'picture-div user-item'});
            const itemContentDiv = $('<div></div>')
                .attr({'class': 'content-div user-item'});
            link.append(itemImgDiv);
            link.append(itemContentDiv);
            // add picture
            const itemImg = $('<img></img>')
                .attr({'src': s3URL + itemData.pictures.split(',')[0]});
            itemImgDiv.append(itemImg);
            // add title, item-info and tags Divs
            const titleDiv = $('<span></span>')
                .attr({'class': 'title user-item'})
                .html(itemData.title);
            const tagsDiv = $('<div></div>')
                .attr({'class': 'introduction-div tags user-item'});
            itemContentDiv.append(titleDiv);
            itemContentDiv.append(tagsDiv);
            // add tags to tagsDiv
            const tagsArr = itemData.tags;
            for (let j = 0; j < tagsArr.length; j++) {
              const tagSpan = $('<div />')
                  .attr('class', 'tag user-item').html(`${tagsArr[j]} `);
              tagsDiv.append(tagSpan);
            }
          });
        } else {
          const match = $('<div></div>').attr({
            'class': 'match-container',
            'id': 'no-match-text',
          }).html('目前沒有配對');
          $('#items-area-match').append(match);
        }
        if ($('.item-div.user-item.cur-user').length > 0) {
          $('.item-div.user-item.cur-user:first').trigger('click');
        }
      },
      error: () => {
        alert('金拍謝，暫時無法取得您的配對資料，若持續發生請聯繫我們');
      },
    });
  })(token);
}

// 切換查詢物件
$('#search-by-curuser-item').click(() => {
  $('#search-by-curuser-item').attr('style', 'background:rgb(235,235,235);');
  $('#search-by-required-item').attr('style', 'background:none;');
  $('.item-div.user-item.cur-user')
      .attr('style', 'display:flex;background:none;');
  $('.item-div.user-item.required-user')
      .attr('style', 'display:none;background:none;');
  if ($('.item-div.user-item.cur-user').length > 0) {
    $('.item-div.user-item.cur-user:first').trigger('click');
  }
});
$('#search-by-required-item').click(() => {
  $('#search-by-curuser-item').attr('style', 'background:none;');
  $('#search-by-required-item').attr('style', 'background:rgb(235,235,235);');
  $('.item-div.user-item.required-user')
      .attr('style', 'display:flex;background:none;');
  $('.item-div.user-item.cur-user')
      .attr('style', 'display:none;background:none;');
  if ($('.item-div.user-item.required-user').length > 0) {
    $('.item-div.user-item.required-user:first').trigger('click');
  }
});

function getMatchedResultData(itemId, matchResultObj, itemType) {
  let matchedItemsDataArr;
  // 取得 matches
  if (itemType === 'requiredUser') {
    const tempDArr = matchResultObj.doubleMatchResultArr
        .filter((match) => match.secondUserWant.item_id === itemId);
    const tempTArr = matchResultObj.tripleMatchResultArr
        .filter((match) => match.secondUserWant.item_id === itemId);
    matchedItemsDataArr = tempDArr.concat(tempTArr);
  } else {
    const tempDArr = matchResultObj.doubleMatchResultArr
        .filter((match) => match.curUserWant.item_id === itemId);
    const tempTArr = matchResultObj.tripleMatchResultArr
        .filter((match) => match.curUserWant.item_id === itemId);
    matchedItemsDataArr = tempDArr.concat(tempTArr);
  }
  $('#items-area-match').empty();
  // 畫大框框給每個 match
  for (let i = 0; i < matchedItemsDataArr.length; i++) {
    // 點擊後可以送出配對確認給對方
    const match = $('<div></div>').attr({'class': 'match-container'});
    $('#items-area-match').append(match);
    const interaction = $('<div></div>')
        .attr({'class': 'match-interaction-container'});
    match.append(interaction);
    const interactionBtnDiv = $('<div></div>')
        .attr({'class': 'interaction-btn-div'});
    interaction.append(interactionBtnDiv);
    const data = {};
    data.requiredItemId =
    matchedItemsDataArr[i].secondUserWant.item_id; // 2_item_id
    data.wantItemId =
    matchedItemsDataArr[i].curUserWant.item_id; // user_item_id
    const confirmBtn = $('<button></button>').attr({
      'class': 'interaction-btn',
    }).html('確認交換').click(() => { // 送出確認請求
      data.type = 'confirm';
      console.log('data is:');
      console.log(data);
      $.ajax({
        url: '/api/1.0/want/confirm',
        type: 'post',
        data: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        success: (checkAllConfirmResultArr) => {
          checkStatusNodeArr[0]
              .html(`${localStorage.getItem('nickname')} : 已確認`);
          interactionBtnDiv.attr({'style': 'display:none;'});
          // 若有配對成功，alert 成功訊息
          alert(checkAllConfirmResultArr.msg);
          location.reload();
        },
        error: () => {
          alert('金拍謝，暫時無法為您送出交換邀請確認請求，若持續發生請聯繫我們');
        },
      });
    });
    const checkStatusNodeArr = [];
    /**
     * 商品資訊區
     */
    // 每個配對的 item 一個框框
    // let divCounter = 0;
    let show = true;
    for (const e in matchedItemsDataArr[i]) {
      if (typeof matchedItemsDataArr[i][e] === 'object') {
        const itemData = matchResultObj.itemsDataArr
            .filter((item) => item.id === matchedItemsDataArr[i][e].item_id)[0];
        const link = $('<a></a>')
            .attr({'href': `/items/detail?item_id=${itemData.id}`});
        link.insertBefore(interaction);
        // Create new Item outside container
        const newItemContainerOutside = $('<div></div>')
            .attr({'class': 'item-container outside main index'});
        link.append(newItemContainerOutside);
        // Create new Item inside container
        const newItemContainerInside = $('<div></div>')
            .attr({'class': 'item-container inside main index'});
        newItemContainerOutside.append(newItemContainerInside);
        // Create basedonDiv, itemImgDiv and itemContentDiv
        const basedonDiv = $('<div></div>').attr({'class': 'based-on'});
        const itemImgDiv = $('<div></div>').attr({'class': 'item-img main'});
        const itemContentDiv = $('<div></div>').attr({'class': 'item content'});
        newItemContainerInside.append(basedonDiv);
        newItemContainerInside.append(itemImgDiv);
        newItemContainerInside.append(itemContentDiv);
        // basedonDiv text spans
        const basedonSpan = $('<span />');
        if (e === 'curUserWant') {
          basedonSpan.html('您提供的物品');
        } else if (e === 'secondUserWant') {
          basedonSpan.html('您配對的物品');
        } else if (e === 'thirdUserWant') {
          basedonSpan.html('第三人的物品');
        }
        basedonDiv.append(basedonSpan);
        // add picture
        const itemImg = $('<img></img>')
            .attr({'src': s3URL + itemData.pictures.split(',')[0]});
        itemImgDiv.append(itemImg);
        // add title, item-info and tags Divs
        const titleDiv = $('<div></div>')
            .attr({'class': 'item title'}).html(`${itemData.title}`);
        const itemInfoDiv = $('<div></div>').attr({'class': 'item info'});
        const tagsDiv = $('<div></div>').attr({'class': 'item tags'});
        itemContentDiv.append(titleDiv);
        itemContentDiv.append(itemInfoDiv);
        itemContentDiv.append(tagsDiv);
        // add nickname and status span
        const nicknameSpan = $('<span />')
            .attr({'class': 'nickname'}).html(`${itemData.user_nickname}`);
        itemInfoDiv.append(nicknameSpan);
        // add tags to tagsDiv
        const tagsArr = itemData.tags;
        for (let j = 0; j < tagsArr.length; j++) {
          const tagSpan = $('<span />').html(`${tagsArr[j]} `);
          tagsDiv.append(tagSpan);
        }
        /**
         * 配對互動區
         */
        if (matchedItemsDataArr[i].curUserWant.confirmed === 1) {
          show = false;
        }
        const confirmed = matchedItemsDataArr[i][e].confirmed === 1 ?
        '已確認' : '未確認';
        const ownercheckStatsus = $('<div></div>')
            .attr({'class': 'user-check-status'})
            .html(`${itemData.user_nickname}: ${confirmed}`);
        checkStatusNodeArr.push(ownercheckStatsus);
        ownercheckStatsus.insertBefore(interactionBtnDiv);
        // divCounter++;
      } else {
        console.log(e);
      }
    }
    if (show) {
      interactionBtnDiv.append(confirmBtn);
    }
  }
}
