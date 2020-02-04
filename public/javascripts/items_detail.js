let page = 0;
let user_nickname = null;
// 確認使用者有登入，如果沒有，跳alert請user登入
$('#change-btn-item-detail').click(()=>{
  if (!localStorage.getItem('nickname')) {
    alert('plz sign in to active change function');
    return;
  } else {
    user_nickname = localStorage.getItem('nickname');
    // 前端發送 ajax，更新現有頁面為申請者所有物品頁面
    $.ajax({
      url: `/api/1.0/items/all?page=${page}&user_nickname=${user_nickname}`,
      type: 'get',
      success: (itemsListArr)=>{
        for (let i = 6 * page; i < (6 * page + itemsListArr.length); i++) {
          // Create link to item detail page
          let link = $('<a></a>');
          $('#items-area-recommand').append(link);
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
      }
    })
  }
})