// const alphabetArr = ['A', 'B', 'C']
if (!localStorage.getItem('token')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('請登入以進行物品交換確認');
  window.location.assign('/');
  // 應確認使用者為指定 user_nickname 的使用者
} else {
  let token = localStorage.getItem('token');
  ((token)=>{
    // 取得配對物品清單
    $.ajax({
      url: `/api/1.0/want/check`,
      type: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: (objectOfmatchesResultArr) => {
        console.log(objectOfmatchesResultArr);
        let bArr = objectOfmatchesResultArr.b_itemObjectArr
        if (bArr.length > 0) {
          bArr.forEach(want=>{
            let link = $('<div></div>').attr({ 
              'class': 'item-div user-item',
            }).click(()=>{
              $('.item-div.user-item').attr('style','background:none;')
              link.attr('style','background:rgb(235,235,235);')
              getMatchedResultData(want.id, want.title, 'want')
            })
            $('#items-area-user-item').append(link);
            let itemImgDiv = $('<div></div>').attr({ 'class': 'picture-div user-item' });
            let itemContentDiv = $('<div></div>').attr({ 'class': 'content-div user-item' });
            link.append(itemImgDiv);
            link.append(itemContentDiv);
            // add picture
            let itemImg = $('<img></img>').attr({ 'src': s3_url + want.pictures.split(',')[0] });
            itemImgDiv.append(itemImg);
            // add title, item-info and tags Divs
            let titleDiv = $('<span></span>').attr({ 'class': 'title user-item' }).html(want.title);
            // let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
            let tagsDiv = $('<div></div>').attr({ 'class': 'introduction-div tags user-item' });
            itemContentDiv.append(titleDiv);
            itemContentDiv.append(tagsDiv);
            // add tags to tagsDiv
            let tagsArr = want.tags.split(' ')
            for (let j = 0; j < tagsArr.length; j++) {
              let tagSpan = $('<div />').attr('class', 'tag user-item').html(`${tagsArr[j]} `);
              tagsDiv.append(tagSpan);
            }
            // let subsItem = $('<div></div>').attr('class','subscribe-item').click(()=>{
            //   getMatchedResultData(want.id, want.title, 'want')
            // })
            // subsItem.insertAfter($('#subs-subtext'));
            // let subsContent = $('<div></div>').attr('class','subscribe-content')
            // subsItem.append(subsContent);
            // let subsSpan = $('<span></span>').html(want.title);
            // subsContent.append(subsSpan)
          })
        } else {
          let subsItem = $('<div></div>').attr('class','subscribe-item')
          subsItem.insertAfter($('#subs-subtext'));
          let subsContent = $('<div></div>').attr('class','subscribe-content')
          subsItem.append(subsContent);
          let subsSpan = $('<span></span>').html('目前沒有配對');
          subsContent.append(subsSpan)
        }
      },
      error: (err) => {
        alert(err);
      }
    })
  })(token)
}

function getMatchedResultData(want_item_id, want_title, item_type) {
  // call wantAPI get matched data (by want_item_id)
  $.ajax({
    url: `/api/1.0/want/matches/${item_type}?id=${want_item_id}`,
    type: 'get',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: (matchedItemsDataArr) => {
      console.log('matchedItemsDataArr')
      console.log(matchedItemsDataArr)
      // 取得所有 match result of item
      // console.log(matchedItemsDataArr);
      // $('#subtext-matched-result-page').html(`Matched Results of ${want_title}`);
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
        data.required_item_id = want_item_id; // 2_item_id
        data.want_item_id = matchedItemsDataArr[i].C_id; // user_item_id
        let confirmBtn = $('<button></button>').attr({
          'class': 'interaction-btn',
        }).html('確認').click(() => {
          data.type = 'confirm';
          console.log('data is:');
          console.log(data);
          $.ajax({
            url: `/api/1.0/want/checked`,
            type: 'post',
            data: data,
            success: (checkAllConfirmResultArr) => {
              checkStatusNodeArr[1].html(`User :  您, 已確認`)
              interactionBtnDiv.attr({ 'style': 'display:none;' })
              // 若有配對成功，alert 成功訊息
              alert(checkAllConfirmResultArr.msg);
              if (checkAllConfirmResultArr.msg = '配對成功！商品已自動為您下架，請至配對頁查詢配對結果') {
                // match.attr({ 'style': 'display:none;' })
                location.reload()
              }
            },
            error: (error) => {
              console.log(error);
              alert('金拍謝，暫時無法為您送出交換邀請確認請求，若持續發生請聯繫我們')
              return;
            },
          })
        });
        // let interactors = 0;
        let checkStatusNodeArr = [];
        let ownersArr;
        if (!matchedItemsDataArr[i].B_id) {
          interactors = 2;
          ownersArr = ['對方', '  您'];
        } else {
          interactors = 3;
          ownersArr = ['他人', '  您', '對方'];
        }
        /**
         * 商品資訊區
         */
        // 每個配對的 item 一個框框
        let divCounter = 0
        let show = true;
        for (e in matchedItemsDataArr[i]) {
          // console.log(typeof matchedItemsDataArr[i][e]);
          if (typeof matchedItemsDataArr[i][e] === 'object') {
            let link = $('<a></a>').attr({ 'href': `/items/detail?item_id=${matchedItemsDataArr[i][e].id}` });
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
            if (e === 'A_item') {
              basedonSpan.html('您想要的物品');
            } else if (e === 'B_item') {
              basedonSpan.html('第三人的物品');
            } else if (e === 'C_item') {
              basedonSpan.html('您提供的物品');
            }
            basedonDiv.append(basedonSpan);
            // add picture
            let itemImg = $('<img></img>').attr({ 'src': s3_url + matchedItemsDataArr[i][e].pictures.split(',')[0] });
            itemImgDiv.append(itemImg);
            // add title, item-info and tags Divs
            let titleDiv = $('<div></div>').attr({ 'class': 'item title' }).html(`${matchedItemsDataArr[i][e].title}`);
            let itemInfoDiv = $('<div></div>').attr({ 'class': 'item info' });
            let tagsDiv = $('<div></div>').attr({ 'class': 'item tags' });
            itemContentDiv.append(titleDiv);
            itemContentDiv.append(itemInfoDiv);
            itemContentDiv.append(tagsDiv);
            // add nickname and status span
            let nicknameSpan = $('<span />').attr({ 'class': 'nickname' }).html(`${matchedItemsDataArr[i][e].user_nickname}`);
            // let statusSpan = $('<span />').attr({
            //   'class': 'status',
            //   'id': 'item-status',
            // }).html(`${matchedItemsDataArr[i][e].status}`);
            itemInfoDiv.append(nicknameSpan);
            // itemInfoDiv.append(statusSpan);
            // add tags to tagsDiv
            let tagsArr = matchedItemsDataArr[i][e].tags.split(' ')
            for (let j = 0; j < tagsArr.length; j++) {
              let tagSpan = $('<span />').html(`${tagsArr[j]} `);
              tagsDiv.append(tagSpan);
            }
            /**
             * 配對互動區
             */
            if (matchedItemsDataArr[i][e].checked === 'confirm') {
              matchedItemsDataArr[i][e].checked = '已確認'
            } else {
              matchedItemsDataArr[i][e].checked = '未確認'
            }

            let ownercheckStatsus = $('<div></div>').attr({ 'class': 'user-check-status' }).html(
              `User : ${ownersArr[divCounter]}, ${matchedItemsDataArr[i][e].checked}`
            );
            if (matchedItemsDataArr[i][e].checked === "deny") {
              ownercheckStatsus.attr({
                'class': 'user-check-status',
                'style': 'background: #FAD7AC; color: #000'
              })
            }
            checkStatusNodeArr.push(ownercheckStatsus);
            ownercheckStatsus.insertBefore(interactionBtnDiv);
            if (matchedItemsDataArr[i][e].checked === "deny") {
              show = false;
            }
            if (matchedItemsDataArr[i].A_item.checked === "confirm") {
              show = false;
            }
            divCounter++;
          } else {
            // console.log(e);
          }
        }
        if (show) {
          interactionBtnDiv.append(confirmBtn);
          // interactionBtnDiv.append(denyBtn);
        }
      }
    },
    error: (err) => {
      alert('金拍謝，暫時找不到你的交易邀請配對資訊QQ，若持續發生請聯繫我們')
      return;
    }
  })
}

// function updateCheckStatus(ownersArr, chcek) {
//   if (check) {
//     // user click btn "check"

//   } else {

//   }
//   $.ajax({
//     url: `/api/1.0/matches/status`,
//     type: 'update',
//     data: {
//       tradeType: tradeType,
//     },
//     success: () => {
//       checkStatusNodeArr[userIndex].html(`User : ${user_nickname}, Check : true`)
//       interactionBtnDiv.attr({ 'style': 'display:none;' })
//     },
//     error: () => {

//     },
//   })
// }