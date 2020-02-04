// Set s3 base url
$('#img').attr({
  'src': s3_url + 'userUpload/aaa/aaa-1580695614591',
})

let page = 0;
let nomoreUpdate = false;
createMoreItems();
// $('#nomore-text-div').click(
//   createMoreItems()
// );
$(window).scroll(function () {
  // 判斷整體網頁的高度
  const $BodyHeight = $(document).height();
  // 判斷所見範圍的高度
  const $ViewportHeight = $(window).height();
  // 偵測目前捲軸頂點
  $ScrollTop = $(this).scrollTop();

  if ($BodyHeight - ($ViewportHeight + $ScrollTop) < 10 ) {
    if (page !== 'end') {
      createMoreItems();
    } else {
      if (!nomoreUpdate) {
        nomoreUpdate = true;
        $('#nomore-text-div').attr({'onclick': ''}).html('no more items');
      }
    }
  };
});

function createMoreItems() {
  $.ajax({
    url: `/api/1.0/items/all?page=${page}`,
    type: 'get',
    success: (itemsListArr) => {
      for (let i = 6 * page; i < (6 * page + itemsListArr.length); i++) {
        // Create link to item detail page
        let link = $('<a></a>').attr({ 'href': `/items/detail?item_id=${itemsListArr[i - 6 * page].id}` });
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
    },
    error: (failResponse) => {
      console.log(failResponse);
      alert(failResponse);
    }
  })
}