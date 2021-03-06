/* eslint-disable camelcase */
/* eslint-disable max-len */
const users = [
  {
    id: 4,
    sign_id: 'sys',
    password: 'ddb31689f83db5f8e614040b37b1f2068ada833f24bbe52afe33dffe6196ccbc',
    nickname: 'system',
    token: 'sys',
  },
  {
    id: 1,
    sign_id: 'test',
    password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    nickname: '測試用戶',
    token: 'test',
  },
  {
    id: 2,
    sign_id: 'test2',
    password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    nickname: '測試用戶2',
    token: 'test2',
  },
  {
    id: 3,
    sign_id: 'test3',
    password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    nickname: '測試用戶3',
    token: 'test3',
  },
];

const items = [
  // items 1-3 for available want logic test
  { // item 1
    id: 1,
    user_id: 1,
    title: 'Canonet QL17',
    status: '二手',
    introduction: '在日本找到的，功能良好，自己拍了一年多。\n上個月剛去清內室和快門，平常都住防潮箱，因為被朋友的萊卡燒到，想看看有沒有機會換到一台萊卡。\n有意願的朋友可以送邀請給我。',
    pictures: 'test/test/1.jpg,test/test/2.jpg,test/test/3.jpg,',
    availability: 'true',
    matched_id: null,
    matched_item_id: null,
  },
  { // item 2
    id: 2,
    user_id: 2,
    title: 'Leica M9',
    status: '二手',
    introduction: '爸爸送我的生日禮物，說是他以前常用的相機。\n雖然我很喜歡拍照，但是家裡全部都是萊卡，M9也有好幾台，很想換換口味。\n如果有保存條件不錯的相機歡迎送邀請給我，只要機能正常，來者不拒。',
    pictures: 'test/test2/1.jpg,test/test2/2.jpg,test/test2/3.jpg,',
    availability: 'true',
    matched_id: null,
    matched_item_id: null,
  },
  { // item 3
    id: 3,
    user_id: 3,
    title: 'Agfa 1535 街拍必備',
    status: '二手',
    introduction: '之前學街拍的時候和別人買的二手機。\n雖然已經用很久了，但結構還很穩健。\n雖然快門鍵程短很容易誤擊，但習慣之後就不太會發生了。\n推薦給喜歡輕量機的人，希望可以換到4/3系統的可換鏡相機。',
    pictures: 'test/test3/1.jpg,test/test3/2.jpg,test/test3/3.jpg,',
    availability: 'true',
    matched_id: null,
    matched_item_id: null,
  },
  // items 4-5 for double matched logic test
  { // item 4
    id: 4,
    user_id: 1,
    title: 'Minolta TC-1 最後的榮光',
    status: '二手',
    introduction: '市場上少見的 Minolta 相機中，TC-1 是我個人最喜歡的一款。這款是當初 Minolta 嘔心瀝血推出的機型，在當時可以說是集技術之大成。\n從以前到現在陪我去過了各式各樣的地方，他的輕便和精巧是我最喜歡的地方。\n雖然很喜歡，但希望更多人能認識這款相機，於是割愛交換。\n希望能遇到愛惜相機的同好和我交換。',
    pictures: 'test/test/4.jpg,test/test/5.jpg,test/test/6.jpg,',
    availability: 'false',
    matched_id: 1,
    matched_item_id: 5,
  },
  { // item 5
    id: 5,
    user_id: 2,
    title: 'Canon AE-1 新手經典機',
    status: '二手',
    introduction: '討論度一直都不低的Canon AE-1，就不多說明了。\n天天住防潮箱，因為年紀大了想換背輕一點的相機，希望好心的換友可以體諒老人家 T_T ...',
    pictures: 'test/test2/4.jpg,test/test2/5.jpg,test/test2/6.jpg,',
    availability: 'false',
    matched_id: 1,
    matched_item_id: 4,
  },
  // items 6-8 for triple matched logic test
  { // item 6
    id: 6,
    user_id: 1,
    title: 'Olympus 35 RC 全新相機(真的)',
    status: '全新',
    introduction: '前陣子整理阿公的房間發現的...竟然把一整台好好的相機連盒子一起放到老，傻眼。\n阿公現在已經拍不動了，我也很久沒有拍照了，就讓給還有熱情的換友吧～\n希望可以換到美美的觀賞機，然後可以順便請我阿公吃頓飯聊聊他的故事(?)\n期待有緣人囉',
    pictures: 'test/test/7.jpg,test/test/8.jpg,test/test/9.jpg,',
    availability: 'false',
    matched_id: 2,
    matched_item_id: 7,
  },
  { // item 7
    id: 7,
    user_id: 2,
    title: 'Polaroid 寶麗來 One Step',
    status: '全新',
    introduction: '當兵前女友送我的禮物，\n然後...就沒有然後了。\n拜託有緣人把它換走，隨便什麼都可以。',
    pictures: 'test/test2/7.jpg,test/test2/8.jpg,',
    availability: 'false',
    matched_id: 2,
    matched_item_id: 8,
  },
  { // item 8
    id: 8,
    user_id: 3,
    title: 'Plaubel Makina 67 中片幅相機',
    status: '二手',
    introduction: '生小孩之後就沒辦法常常出去拍照了，這台陪我度過許多年的神兵也不再適合我了。\n希望能換到一台小巧的底片相機，快門速度至少1/1000或更快(小朋友都跑很快)\n希望有體力又有錢買中片幅的換友帶我的老朋友踏上新的征途～',
    pictures: 'test/test3/7.jpg,test/test3/8.jpg,',
    availability: 'false',
    matched_id: 2,
    matched_item_id: 6,
  },
];


const want = [
  // for non-matched want test
  {
    id: 1,
    want_item_id: 1,
    required_item_id: 2,
    confirmed: 0,
  },
  {
    id: 2,
    want_item_id: 2,
    required_item_id: 1,
    confirmed: 0,
  },
  {
    id: 3,
    want_item_id: 2,
    required_item_id: 3,
    confirmed: 0,
  },
  {
    id: 4,
    want_item_id: 3,
    required_item_id: 1,
    confirmed: 0,
  },
  // for double match test
  {
    id: 5,
    want_item_id: 4,
    required_item_id: 5,
    confirmed: 1,
  },
  {
    id: 6,
    want_item_id: 5,
    required_item_id: 4,
    confirmed: 1,
  },
  // for triple match test
  {
    id: 7,
    want_item_id: 6,
    required_item_id: 7,
    confirmed: 1,
  },
  {
    id: 8,
    want_item_id: 7,
    required_item_id: 8,
    confirmed: 1,
  },
  {
    id: 9,
    want_item_id: 8,
    required_item_id: 6,
    confirmed: 1,
  },
];

const main_categories = [
  {
    id: 1,
    main_category: '其他',
  },
  {
    id: 2,
    main_category: '攝影',
  },
  {
    id: 3,
    main_category: '棒球',
  },
  {
    id: 4,
    main_category: '美妝',
  },
  {
    id: 5,
    main_category: '拳擊',
  },
  {
    id: 6,
    main_category: '籃球',
  },
];

const sub_categories = [
  {
    id: 1,
    sub_category: '其他',
  },
  {
    id: 2,
    sub_category: '相機',
  },
  {
    id: 3,
    sub_category: '鏡頭',
  },
  {
    id: 4,
    sub_category: '底片',
  },
  {
    id: 5,
    sub_category: '沖洗用具',
  },
  {
    id: 6,
    sub_category: '球棒',
  },
  {
    id: 7,
    sub_category: '眼影',
  },
  {
    id: 8,
    sub_category: '遮瑕糕',
  },
  {
    id: 9,
    sub_category: '化妝水',
  },
  {
    id: 10,
    sub_category: '面膜',
  },
  {
    id: 11,
    sub_category: '拳套',
  },
  {
    id: 12,
    sub_category: '手綁帶',
  },
  {
    id: 13,
    sub_category: '護具',
  },
  {
    id: 14,
    sub_category: '手靶',
  },
  {
    id: 15,
    sub_category: '腿靶',
  },
  {
    id: 16,
    sub_category: '訓練用品',
  },
  {
    id: 17,
    sub_category: '鞋',
  },
  {
    id: 18,
    sub_category: '球衣',
  },
  {
    id: 19,
    sub_category: '球員卡',
  },
  {
    id: 20,
    sub_category: '紀念品',
  },
];

const main_sub_categories = [
  {
    main_category_id: 1,
    sub_category_id: 1,
  },
  {
    main_category_id: 2,
    sub_category_id: 1,
  },
  {
    main_category_id: 2,
    sub_category_id: 2,
  },
  {
    main_category_id: 2,
    sub_category_id: 3,
  },
  {
    main_category_id: 2,
    sub_category_id: 4,
  },
  {
    main_category_id: 2,
    sub_category_id: 5,
  },
  {
    main_category_id: 3,
    sub_category_id: 1,
  },
  {
    main_category_id: 3,
    sub_category_id: 6,
  },
  {
    main_category_id: 4,
    sub_category_id: 1,
  },
  {
    main_category_id: 4,
    sub_category_id: 7,
  },
  {
    main_category_id: 4,
    sub_category_id: 8,
  },
  {
    main_category_id: 4,
    sub_category_id: 9,
  },
  {
    main_category_id: 4,
    sub_category_id: 10,
  },
  {
    main_category_id: 5,
    sub_category_id: 1,
  },
  {
    main_category_id: 5,
    sub_category_id: 11,
  },
  {
    main_category_id: 5,
    sub_category_id: 12,
  },
  {
    main_category_id: 5,
    sub_category_id: 13,
  },
  {
    main_category_id: 5,
    sub_category_id: 14,
  },
  {
    main_category_id: 5,
    sub_category_id: 15,
  },
  {
    main_category_id: 5,
    sub_category_id: 16,
  },
  {
    main_category_id: 3,
    sub_category_id: 17,
  },
  {
    main_category_id: 3,
    sub_category_id: 18,
  },
  {
    main_category_id: 3,
    sub_category_id: 19,
  },
  {
    main_category_id: 3,
    sub_category_id: 20,
  },
  {
    main_category_id: 6,
    sub_category_id: 1,
  },
  {
    main_category_id: 6,
    sub_category_id: 17,
  },
  {
    main_category_id: 6,
    sub_category_id: 18,
  },
  {
    main_category_id: 6,
    sub_category_id: 19,
  },
  {
    main_category_id: 6,
    sub_category_id: 20,
  },
];

const messages = [
  {
    id: 1,
    content: '已建立您對"Canon AE-1 新手經典機"的一組新兩人配對，快到"配對查詢"頁面確認吧！',
    sender: 4,
    watched: 0,
    link: '/want/check/',
    receiver: 1,
    mentioned_item_id: 2,
    matched_id: null,
  },
  {
    id: 2,
    content: '恭喜！您以"Minolta TC-1 最後的榮光"對"Canon AE-1 新手經典機"的交換已成交～交換編號為 1 號，現在就打開"成交紀錄"頁面，和對方討論交換細節吧！',
    sender: 4,
    watched: 0,
    link: '/matches/confirmed/',
    receiver: 1,
    mentioned_item_id: 5,
    matched_id: 1,
  },
  {
    id: 3,
    content: '恭喜！您以"Canon AE-1 新手經典機"對"Minolta TC-1 最後的榮光"的交換已成交～交換編號為 1 號，現在就打開"成交紀錄"頁面，和對方討論交換細節吧！',
    sender: 4,
    watched: 0,
    link: '/matches/confirmed/',
    receiver: 2,
    mentioned_item_id: 4,
    matched_id: 1,
  },
  {
    id: 4,
    content: '已建立您對"Polaroid 寶麗來 One Step"的一組新三人配對，快到"配對查詢"頁面確認吧！',
    sender: 4,
    watched: 0,
    link: '/want/check/',
    receiver: 1,
    mentioned_item_id: 7,
    matched_id: null,
  },
  {
    id: 5,
    content: '您的物品"Canonet QL17"收到了來自"測試用戶3"的新交換邀請，快到"邀請查詢"頁面查看一下吧',
    sender: 4,
    watched: 0,
    link: '/want/invitation',
    receiver: 1,
    mentioned_item_id: null,
    matched_id: null,
  },
];

const matches = [
  {
    id: 1,
    start_item_id: 4,
    middle_item_id: null,
    end_item_id: 5,
  },
  {
    id: 2,
    start_item_id: 6,
    middle_item_id: 7,
    end_item_id: 8,
  },
];

const item_category = [
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 1,
  },
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 2,
  },
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 3,
  },
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 4,
  },
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 5,
  },
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 6,
  },
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 7,
  },
  {
    main_category_id: 2,
    sub_category: 2,
    item_id: 8,
  },
];

const tags = [
  {
    id: 1,
    tag: 'canonet',
  },
  {
    id: 2,
    tag: 'QL17',
  },
  {
    id: 3,
    tag: '東洋七劍',
  },
  {
    id: 4,
    tag: 'Leica',
  },
  {
    id: 5,
    tag: 'M9',
  },
  {
    id: 6,
    tag: '萊卡',
  },
  {
    id: 7,
    tag: '底片機',
  },
  {
    id: 8,
    tag: 'Agfa',
  },
  {
    id: 9,
    tag: '1535',
  },
  {
    id: 10,
    tag: 'Minolta',
  },
  {
    id: 11,
    tag: 'TC-1',
  },
  {
    id: 12,
    tag: 'canon',
  },
  {
    id: 13,
    tag: 'ae-1',
  },
  {
    id: 14,
    tag: 'Olympus',
  },
  {
    id: 15,
    tag: '35mm',
  },
  {
    id: 16,
    tag: 'RC',
  },
  {
    id: 17,
    tag: 'Polaroid',
  },
  {
    id: 18,
    tag: '寶麗來',
  },
  {
    id: 19,
    tag: 'OneStep',
  },
  {
    id: 20,
    tag: 'Plaubel',
  },
  {
    id: 21,
    tag: 'Makina67',
  },
];

const item_tags = [
  {
    item_id: 1,
    tag_id: 1,
  },
  {
    item_id: 1,
    tag_id: 2,
  },
  {
    item_id: 1,
    tag_id: 3,
  },
  {
    item_id: 2,
    tag_id: 4,
  },
  {
    item_id: 2,
    tag_id: 5,
  },
  {
    item_id: 2,
    tag_id: 6,
  },
  {
    item_id: 2,
    tag_id: 7,
  },
  {
    item_id: 3,
    tag_id: 7,
  },
  {
    item_id: 3,
    tag_id: 8,
  },
  {
    item_id: 3,
    tag_id: 9,
  },
  {
    item_id: 4,
    tag_id: 7,
  },
  {
    item_id: 4,
    tag_id: 10,
  },
  {
    item_id: 4,
    tag_id: 11,
  },
  {
    item_id: 5,
    tag_id: 12,
  },
  {
    item_id: 5,
    tag_id: 13,
  },
  {
    item_id: 5,
    tag_id: 7,
  },
  {
    item_id: 6,
    tag_id: 7,
  },
  {
    item_id: 6,
    tag_id: 14,
  },
  {
    item_id: 6,
    tag_id: 15,
  },
  {
    item_id: 6,
    tag_id: 16,
  },
  {
    item_id: 7,
    tag_id: 17,
  },
  {
    item_id: 7,
    tag_id: 18,
  },
  {
    item_id: 7,
    tag_id: 19,
  },
  {
    item_id: 8,
    tag_id: 20,
  },
  {
    item_id: 8,
    tag_id: 21,
  },
  {
    item_id: 8,
    tag_id: 7,
  },
];

module.exports = {
  items,
  users,
  want,
  main_categories,
  sub_categories,
  messages,
  matches,
  item_category,
  main_sub_categories,
  tags,
  item_tags,
};
