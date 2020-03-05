if (!localStorage.getItem('token')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('請登入以進行物品交換確認');
  window.location.assign('/');
} else {
  let token = localStorage.getItem('token');
  ((token) => {
    // 取得配對物品清單
    $.ajax({
      url: `/api/1.0/want/check`, //會拿到所有的資料,不用再 query 了,點選側邊列時隱藏無關資訊即可
      type: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: (matchResultObj) => {
        // item_id 指的是 user_item_id, 不是想要的 id
        console.log(matchResultObj);
        // let bArr = matchResultObj.b_itemObjectArr
        // 取得"用自身物品查詢"清單
        let curUserItemArr = [];
        matchResultObj.doubleMatchResultArr.forEach(match => {
          let userItemId = match.curUserWant.item_id
          if (curUserItemArr.indexOf(userItemId) === -1) {
            curUserItemArr.push(userItemId);
          }
        })
        matchResultObj.tripleMatchResultArr.forEach(match => {
          let userItemId = match.curUserWant.item_id
          if (curUserItemArr.indexOf(userItemId) === -1) {
            curUserItemArr.push(userItemId);
          }
        })
        // 取得"用想要物品查詢"清單
        let requiredItemArr = [];
        matchResultObj.doubleMatchResultArr.forEach(match => {
          let userItemId = match.secondUserWant.item_id
          if (requiredItemArr.indexOf(userItemId) === -1) {
            requiredItemArr.push(userItemId);
          }
        })
        matchResultObj.tripleMatchResultArr.forEach(match => {
          let userItemId = match.secondUserWant.item_id
          if (requiredItemArr.indexOf(userItemId) === -1) {
            requiredItemArr.push(userItemId);
          }
        })
        // 前端渲染側邊訊息Bar
        if (requiredItemArr.length > 0 || curUserItemArr > 0) {
          let itemIdArr = requiredItemArr.concat(curUserItemArr);
          itemIdArr.forEach(id => {
            let itemData = matchResultObj.itemsDataArr.filter(data => data.id === id)[0]; // 取得itemData
            // 渲染 
            let link;
            if (itemData.user_nickname === localStorage.getItem('nickname')) { // 當前用戶的物品, 預設顯示
              link = $('<div></div>').attr('class', 'item-div user-item cur-user').click(() => { //點擊變色
                $('.item-div.user-item.cur-user').attr('style', 'background:none;')
                link.attr('style', 'background:rgb(235,235,235);')
                getMatchedResultData(itemData.id, matchResultObj, 'curUser')
              })
            } else {
              link = $('<div></div>').attr({ // 非當前用戶物品, 預設不顯示
                class: 'item-div user-item required-user',
                style: 'display:none;',
              }).click(() => { //點擊變色
                $('.item-div.user-item.required-user').attr('style', 'background:none;')
                link.attr('style', 'background:rgb(235,235,235);')
                getMatchedResultData(itemData.id, matchResultObj, 'requiredUser')
              })
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
            // let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
            let tagsDiv = $('<div></div>').attr({ 'class': 'introduction-div tags user-item' });
            itemContentDiv.append(titleDiv);
            itemContentDiv.append(tagsDiv);
            // add tags to tagsDiv
            let tagsArr = itemData.tags.split(' ')
            for (let j = 0; j < tagsArr.length; j++) {
              let tagSpan = $('<div />').attr('class', 'tag user-item').html(`${tagsArr[j]} `);
              tagsDiv.append(tagSpan);
            }
          })
        } else {
          let match = $('<div></div>').attr({ 
            'class': 'match-container',
            'id': 'no-match-text',
           }).html('目前沒有配對');
          $('#items-area-match').append(match);
        }
        if ($('.item-div.user-item.cur-user').length>0) {
          $('.item-div.user-item.cur-user:first').trigger('click');
        }
      },
      error: (err) => {
        alert(err);
      }
    })
  })(token)
}

// 切換查詢物件
$('#search-by-curuser-item').click(() => {
  $('#search-by-curuser-item').attr('style', 'background:rgb(235,235,235);')
  $('#search-by-required-item').attr('style', 'background:none;')
  $('.item-div.user-item.cur-user').attr('style', 'display:flex;background:none;')
  $('.item-div.user-item.required-user').attr('style', 'display:none;background:none;')
  if ($('.item-div.user-item.cur-user').length>0) {
    $('.item-div.user-item.cur-user:first').trigger('click');
  }
})
$('#search-by-required-item').click(() => {
  $('#search-by-curuser-item').attr('style', 'background:none;')
  $('#search-by-required-item').attr('style', 'background:rgb(235,235,235);')
  $('.item-div.user-item.required-user').attr('style', 'display:flex;background:none;')
  $('.item-div.user-item.cur-user').attr('style', 'display:none;background:none;')
  if ($('.item-div.user-item.required-user').length>0) {
    $('.item-div.user-item.required-user:first').trigger('click');
  }
})

function getMatchedResultData(item_id, matchResultObj, item_type) {
  let matchedItemsDataArr
  // 取得 matches
  if (item_type === 'requiredUser') {
    let tempDArr = matchResultObj.doubleMatchResultArr.filter(match=>match.secondUserWant.item_id === item_id)
    let tempTArr = matchResultObj.tripleMatchResultArr.filter(match=>match.secondUserWant.item_id === item_id)
    matchedItemsDataArr = tempDArr.concat(tempTArr);
  } else {
    let tempDArr = matchResultObj.doubleMatchResultArr.filter(match=>match.curUserWant.item_id === item_id)
    let tempTArr = matchResultObj.tripleMatchResultArr.filter(match=>match.curUserWant.item_id === item_id)
    matchedItemsDataArr = tempDArr.concat(tempTArr);
  }
  $('#items-area-match').empty();
  // 畫大框框給每個 match
  for (let i = 0; i < matchedItemsDataArr.length; i++) {
    // 點擊後可以送出配對確認給對方
    let match = $('<div></div>').attr({ 'class': 'match-container' });
    $('#items-area-match').append(match);
    let interaction = $('<div></div>').attr({ 'class': 'match-interaction-container' });
    match.append(interaction);
    let interactionBtnDiv = $('<div></div>').attr({ 'class': 'interaction-btn-div' });
    interaction.append(interactionBtnDiv);
    let data = {};
    data.required_item_id = matchedItemsDataArr[i].secondUserWant.item_id; // 2_item_id
    data.want_item_id = matchedItemsDataArr[i].curUserWant.item_id; // user_item_id
    let confirmBtn = $('<button></button>').attr({
      'class': 'interaction-btn',
    }).html('確認').click(() => { // 送出確認請求
      data.type = 'confirm';
      console.log('data is:');
      console.log(data);
      $.ajax({
        url: `/api/1.0/want/checked`,
        type: 'post',
        data: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // 等一下要去 wantAPI 添加驗證程序
        },
        success: (checkAllConfirmResultArr) => {
          checkStatusNodeArr[0].html(`User :  您, 已確認`)
          interactionBtnDiv.attr({ 'style': 'display:none;' })
          // 若有配對成功，alert 成功訊息
          alert(checkAllConfirmResultArr.msg);
          if (checkAllConfirmResultArr.msg = '配對成功！商品已自動為您下架，請至配對頁查詢配對結果') {
            // match.attr({ 'style': 'display:none;' })
            location.reload()
          }
        },
        error: (error) => {
          console.log(error.errorMsg);
          alert('金拍謝，暫時無法為您送出交換邀請確認請求，若持續發生請聯繫我們')
          return;
        },
      })
    });
    let checkStatusNodeArr = [];
    let ownersArr = Object.keys(matchedItemsDataArr[i]).length === 3 ? ['您', '對方', '他人']:['您', '對方'];
    /**
     * 商品資訊區
     */
    // 每個配對的 item 一個框框
    let divCounter = 0
    let show = true;
    for (e in matchedItemsDataArr[i]) {
      // console.log(typeof matchedItemsDataArr[i][e]);
      if (typeof matchedItemsDataArr[i][e] === 'object') {
        let itemData = matchResultObj.itemsDataArr.filter(item=>item.id === matchedItemsDataArr[i][e].item_id)[0]
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
        let basedonSpan = $('<span />')
        if (e === 'curUserWant') {
          basedonSpan.html('您提供的物品');
        } else if (e === 'secondUserWant') {
          basedonSpan.html('您想要的物品');
        } else if (e === 'thirdUserWant') {
          basedonSpan.html('第三人的物品');
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
        let tagsArr = itemData.tags.split(' ')
        for (let j = 0; j < tagsArr.length; j++) {
          let tagSpan = $('<span />').html(`${tagsArr[j]} `);
          tagsDiv.append(tagSpan);
        }
        /**
         * 配對互動區
         */
        console.log('matchedItemsDataArr[i].curUserWant.checked')
        console.log(matchedItemsDataArr[i].curUserWant.checked)
        if (matchedItemsDataArr[i].curUserWant.checked === "confirm") {show = false}
        let checked = matchedItemsDataArr[i][e].checked === 'confirm'?'已確認':'未確認'
        // if (itemData.checked === 'confirm') {
        //   itemData.checked = '已確認'
        // } else {
        //   itemData.checked = '未確認'
        // }
        let ownercheckStatsus = $('<div></div>').attr({ 'class': 'user-check-status' }).html(
          `User : ${ownersArr[divCounter]}, ${checked}`
        );
        checkStatusNodeArr.push(ownercheckStatsus);
        ownercheckStatsus.insertBefore(interactionBtnDiv);
        divCounter++;
      } else {
        console.log(e);
      }
    }
    if (show) {
      interactionBtnDiv.append(confirmBtn);
    }
  }

}