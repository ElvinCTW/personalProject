// const alphabetArr = ['A', 'B', 'C']
if (!localStorage.getItem('nickname')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('plz sign in to active change function');
  window.location.assign('/');
  // 應確認使用者為指定 user_nickname 的使用者
}

function getMatchedResultData(matched_id, required_item_title) {
  $.ajax({
    url: `/api/1.0/matches/confirmed?matched_id=${matched_id}`,
    type: 'get',
    success: (confirmedMatchObj) => {
      // 取得帶有訊息 array 和物品資料 array 的 obj
      console.log(confirmedMatchObj);
      $('#subtext-matched-result-page').html(`交易討論區 (當前交易編號: ${required_item_title} ,當前交易編號 : ${matched_id})`);
      // 清空右邊物品資訊區
      $('#main-right-inside-container').empty();
      // 根據物品數創造框框
      for (let i = 0; i < confirmedMatchObj.itemDataArr.length; i++) {
        // Create link to item detail page
        let link = $('<a></a>').attr({ 'href': `/items/detail?item_id=${confirmedMatchObj.itemDataArr[i].id}` });
        $('#main-right-inside-container').append(link);
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
        let basedonSpan = $('<span />');
        if (confirmedMatchObj.itemDataArr[i].title === required_item_title) {
          basedonSpan.html('您想要的物品');
        } else if (confirmedMatchObj.itemDataArr[i].user_nickname === localStorage.getItem('nickname')) {
          basedonSpan.html('您提供的物品');
        } else {
          basedonSpan.html('第三人的物品');
        }
        basedonDiv.append(basedonSpan);
        // add picture
        let itemImg = $('<img></img>').attr({ 'src': s3_url + confirmedMatchObj.itemDataArr[i].pictures.split(',')[0] });
        itemImgDiv.append(itemImg);
        // add title, item-info and tags Divs
        let titleDiv = $('<div></div>').attr({ 'class': 'title' }).html(`${confirmedMatchObj.itemDataArr[i].title}`);
        let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
        let tagsDiv = $('<div></div>').attr({ 'class': 'tags' });
        itemContentDiv.append(titleDiv);
        itemContentDiv.append(itemInfoDiv);
        itemContentDiv.append(tagsDiv);
        // add nickname and status span
        let nicknameSpan = $('<span />').attr({ 'class': 'nickname' }).html(`${confirmedMatchObj.itemDataArr[i].user_nickname}`);
        let statusSpan = $('<span />').attr({
          'class': 'status',
          'id': 'item-status',
        }).html(`${confirmedMatchObj.itemDataArr[i].status}`);
        itemInfoDiv.append(nicknameSpan);
        itemInfoDiv.append(statusSpan);
        // add tags to tagsDiv
        let tagsArr = confirmedMatchObj.itemDataArr[i].tags.split(' ')
        for (let j = 0; j < tagsArr.length; j++) {
          let tagSpan = $('<span />').html(`${tagsArr[j]}`);
          tagsDiv.append(tagSpan);
        }
      }
    },
    error: () => {

    }
  })
}