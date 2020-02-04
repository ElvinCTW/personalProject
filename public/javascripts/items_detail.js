// let currentURL = new URL(window.location.href);
// let params = currentURL.searchParams;
// console.log(params);
// for (let pair of params.entries()) {
//   console.log(`key: ${pair[0]}, value: ${pair[1]}`)
// }
// // let item_id = window.location.search.split()
// let item_id = window.location.search.split('=')[1];
// $.ajax({
//   url: `/api/1.0/items/detail?item_id=${item_id}`,
//   type: 'get',
//   success: (itemData)=>{
//     console.log(itemData);
//   },
//   fail: (err)=>{
//     console.log(err);
//   }
// });
// $('#item-detail-title').val('');