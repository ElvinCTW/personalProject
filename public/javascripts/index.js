let page = 0;
let nomoreUpdate = false;
let getData = true;
createMoreItems();
// (()=>{
//   let token = localStorage.getItem('token')?localStorage.getItem('token'):null;
//   // ajax 取得熱門看板清單 (要可以擴充訂閱看板功能)
//   $.ajax({
//     url: `/api/1.0/category/boardList`,
//     type: 'get',
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     success: (boardList) => {
//       console.log(boardList);
//       boardList.forEach(board=>{
//         let link = $('<a />').attr({
//           class:'sidebar-div left',
//           href:`/?main_category=${board.id}`,
//         })
//         link.insertAfter($('#main-list-title'))
//         let div = $('<div />').attr('class','sidebar-div left')
//         link.append(div);
//         let text = $('<div />').attr('class','sidebar-text left').html(board.main_category);
//         div.append(text)
//       })
//     },
//     error: (err) => {
//       alert(err);
//     }
//   })
// })()
/**
 * 捲動時自動帶入新物件
 */
$('#items-area-recommand').scroll(function () {
  // 判斷整體網頁的高度
  const $BodyHeight = $('#items-area-recommand').height(); //920px
  const $ItemHeight = $('.item-link').height(); // 253px;
  // 判斷所見範圍的高度
  // const $ViewportHeight = $(window).height();
  // 偵測目前捲軸頂點
  $ScrollTop = $(this).scrollTop();
  if ((5*$ItemHeight)*(page) < ($BodyHeight + $ScrollTop)*2) {
    if (page !== 'end') {
      if (getData) {
        getData = false;
        createMoreItems();
      } else {
        return;
      }
    } else {
      if (!nomoreUpdate) {
        nomoreUpdate = true;
        $('#nomore-text-div').attr({'onclick': ''}).html('沒有更多物品囉～');
      }
    }
  };
});
/**
 * 取得更多物件
 */
function createMoreItems() {
  if (page !== 'end') {
    let url = `/api/1.0/items/all?page=${page}`
    let params = (new URL(document.location)).searchParams;
    if (params.get('main_category')) {
      url+=`&main_category=${params.get('main_category')}`
    } 
    if (params.get('sub_category')){
      url+=`&sub_category=${params.get('sub_category')}`
    }
    $.ajax({
      url: url,
      type: 'get',
      success: (itemsListArr) => {
        for (let i = 20 * page; i < (20 * page + itemsListArr.length); i++) {
          // Create link to item detail page
          let link = $('<a></a>').attr({ 
            'href': `/items/detail?item_id=${itemsListArr[i - 20 * page].id}`,
            'class': 'item-link'
           });
          $('#items-area-recommand').append(link);
          // Create new Item outside container
          let newItemContainer_Outside = $('<div></div>').attr({ 'class': 'item-container outside main index' });
          link.append(newItemContainer_Outside);
          // Create new Item inside container
          let newItemContainer_Inside = $('<div></div>').attr({ 'class': 'item-container inside main index' });
          newItemContainer_Outside.append(newItemContainer_Inside);
          // Create basedonDiv, itemImgDiv and itemContentDiv
          // let basedonDiv = $('<div></div>').attr({ 'class': 'based-on' });
          let itemImgDiv = $('<div></div>').attr({ 'class': 'item-img main' });
          let itemContentDiv = $('<div></div>').attr({ 'class': 'item content' });
          // newItemContainer_Inside.append(basedonDiv);
          newItemContainer_Inside.append(itemImgDiv);
          newItemContainer_Inside.append(itemContentDiv);
          // basedonDiv text spans
          // let basedonSpan = $('<span />').html('Based on ');
          // let basedontag = $('<span />').attr({ 'id': 'basedon-tag' }).html('#something');
          // basedonDiv.append(basedonSpan);
          // basedonDiv.append(basedontag);
          // add picture
          let itemImg = $('<img></img>').attr({ 'src': s3_url + itemsListArr[i - 20 * page].pictures.split(',')[0] });
          itemImgDiv.append(itemImg);
          // add title, item-info and tags Divs
          let titleDiv = $('<div></div>').attr({ 'class': 'item title' }).html(`${itemsListArr[i - 20 * page].title}`);
          let itemInfoDiv = $('<div></div>').attr({ 'class': 'item info' });
          let tagsDiv = $('<div></div>').attr({ 'class': 'item tags' });
          itemContentDiv.append(itemInfoDiv);
          itemContentDiv.append(titleDiv);
          itemContentDiv.append(tagsDiv);
          // add nickname and status span
          let nicknameSpan = $('<span />').attr({ 'class': 'nickname' }).html(`${itemsListArr[i - 20 * page].user_nickname}`);
          // let statusSpan = $('<span />').attr({
          //   'class': 'status',
          //   'id': 'item-status',
          // }).html(`${itemsListArr[i - 20 * page].status}`);
          itemInfoDiv.append(nicknameSpan);
          // itemInfoDiv.append(statusSpan);
          // add tags to tagsDiv
          let tagsArr = itemsListArr[i - 20 * page].tags.split(' ')
          for (let j = 0; j < tagsArr.length; j++) {
            let tagSpan = $('<span />').html(`${tagsArr[j]} `);
            tagsDiv.append(tagSpan);
          }
        }
        if (itemsListArr.length === 20) {
          page += 1;
        } else {
          page = 'end'
        }
        getData = true;
      },
      error: (failResponse) => {
        console.log(failResponse);
        alert('物品暫時無法顯示，QQ，若持續發生請聯繫我們');
      }
    })
  } else {
    if (!nomoreUpdate) {
      nomoreUpdate = true;
      $('#nomore-text-div').attr({'onclick': ''}).html('沒有更多物品囉～');
    }
  }
}