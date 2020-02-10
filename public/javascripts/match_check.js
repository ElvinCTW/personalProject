if (!localStorage.getItem('nickname')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('plz sign in to active change function');
  window.location.assign('/');
}

function getMatchedResultData(want_item_id, want_title, item_type) {
  // call wantAPI get matched data (by want_item_id)
  $.ajax({
    url: `/api/1.0/matches/item/${item_type}?id=${want_item_id}`,
    type: 'get',
    success: (matchedItemsDataArr) => {
      $('#subtext-matched-result-page').html(`Matched Results of ${want_title}`);
      $('#items-area-recommand').empty();
      for (let i = 0; i < matchedItemsDataArr.length; i++) {
        // 點擊後可以送出配對確認給對方
        let match = $('<div></div>').attr({'class': 'match-container'});
        $('#items-area-recommand').append(match);
        /**
         * 商品資訊區
         */
        let link = $('<a></a>').attr({ 'href': `/items/detail?item_id=${matchedItemsDataArr[i].id}` });
        match.append(link);
        // Create new Item outside container
        let newItemContainer_Outside = $('<div></div>').attr({ 'class': 'item-container-outside recommands' });
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
        if (matchedItemsDataArr[i].matched === 'true') {
          let basedonSpan = $('<span />').html('Double Matched');
        } else {
          let basedonSpan = $('<span />').html('Triple Matched');
        }
        basedonDiv.append(basedonSpan);
        // add picture
        let itemImg = $('<img></img>').attr({ 'src': s3_url + matchedItemsDataArr[i].pictures.split(',')[0] });
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
        /**
         * 配對互動區
         */
        let interaction = $('<div></div>').attr({'class': 'match-interaction-container'});
        match.append(interaction);
      }
    },
    error: ()=>{

    }
  })
  // create boxes after get data 
}