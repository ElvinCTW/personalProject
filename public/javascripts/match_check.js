// const alphabetArr = ['A', 'B', 'C']
if (!localStorage.getItem('nickname')) {
  // 確認使用者有登入，如果沒有，跳alert請user登入
  alert('請登入以進行物品交換確認');
  window.location.assign('/');
  // 應確認使用者為指定 user_nickname 的使用者
}

function getMatchedResultData(want_item_id, want_title, item_type) {
  // call wantAPI get matched data (by want_item_id)
  $.ajax({
    url: `/api/1.0/want/matches/${item_type}?id=${want_item_id}&nickname=${localStorage.getItem('nickname')}`,
    type: 'get',
    success: (matchedItemsDataArr) => {
      // 取得所有 match result of item
      // console.log(matchedItemsDataArr);
      $('#subtext-matched-result-page').html(`Matched Results of ${want_title}`);
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
        }).html('Confirm').click(() => {
          data.type = 'confirm';
          console.log('data is:');
          console.log(data);
          $.ajax({
            url: `/api/1.0/want/checked`,
            type: 'post',
            data: data,
            success: (checkAllConfirmResultArr) => {
              checkStatusNodeArr[1].html(`User : 您, Check : ${data.type}`)
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
          ownersArr = ['對方', '您'];
        } else {
          interactors = 3;
          ownersArr = ['第三人', '您', '對方'];
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
            let newItemContainer_Outside = $('<div></div>').attr({ 'class': 'item-container-outside recommands match' });
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
            let titleDiv = $('<div></div>').attr({ 'class': 'title' }).html(`${matchedItemsDataArr[i][e].title}`);
            let itemInfoDiv = $('<div></div>').attr({ 'class': 'item-info' });
            let tagsDiv = $('<div></div>').attr({ 'class': 'tags' });
            itemContentDiv.append(titleDiv);
            itemContentDiv.append(itemInfoDiv);
            itemContentDiv.append(tagsDiv);
            // add nickname and status span
            let nicknameSpan = $('<span />').attr({ 'class': 'nickname' }).html(`${matchedItemsDataArr[i][e].user_nickname}`);
            let statusSpan = $('<span />').attr({
              'class': 'status',
              'id': 'item-status',
            }).html(`${matchedItemsDataArr[i][e].status}`);
            itemInfoDiv.append(nicknameSpan);
            itemInfoDiv.append(statusSpan);
            // add tags to tagsDiv
            let tagsArr = matchedItemsDataArr[i][e].tags.split(' ')
            for (let j = 0; j < tagsArr.length; j++) {
              let tagSpan = $('<span />').html(`${tagsArr[j]}`);
              tagsDiv.append(tagSpan);
            }
            /**
             * 配對互動區
             */
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

function updateCheckStatus(ownersArr, chcek) {
  if (check) {
    // user click btn "check"

  } else {

  }
  $.ajax({
    url: `/api/1.0/matches/status`,
    type: 'update',
    data: {
      tradeType: tradeType,
    },
    success: () => {
      checkStatusNodeArr[userIndex].html(`User : ${user_nickname}, Check : true`)
      interactionBtnDiv.attr({ 'style': 'display:none;' })
    },
    error: () => {

    },
  })
}