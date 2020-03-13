const users = [
  {
    sign_id: 'test',
    password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    nickname: '測試用戶',
    token: 'test',
    time: '1580475176931',
    watch_msg_time: '1583646727989',
  },
  {
    sign_id: 'testz',
    password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    nickname: '測試用戶2',
    token: 'testz',
    time: '1582631682264',
    watch_msg_time: '1583646755773',
  },
  {
    sign_id: 'ppp',
    password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    nickname: '測試用戶3',
    token: 'ppp',
    time: '1583401085543',
    watch_msg_time: '1583668448697',
  },
];

const items = [
  // items 1-3 for available want logic test
  { // item 1
    user_id: 1,
    tags: '#item1',
    title: 'item1',
    status: '全新',
    introduction: 'item1',
    pictures: 'userUpload/aaa/aaa-1582601355302,',
    time: '1582601355567',
    availability: 'true',
    matched_id: null,
    matched_item_id: null,
  },
  { // item 2
    user_id: 2,
    tags: '#item2',
    title: 'item2',
    status: '全新',
    introduction: 'item2',
    pictures: 'userUpload/zzz/zzz-1583303100343,',
    time: '1583331295751',
    availability: 'true',
    matched_id: null,
    matched_item_id: null,
  },
  { // item 3
    user_id: 3,
    tags: '#item3',
    title: 'item3',
    status: '全新',
    introduction: 'item3',
    pictures: 'userUpload/zzz/zzz-1583303100343,',
    time: '1583331295751',
    availability: 'true',
    matched_id: null,
    matched_item_id: null,
  },
  // items 4-5 for double matched logic test
  { // item 4
    user_id: 1,
    tags: '#item4',
    title: 'item4',
    status: '全新',
    introduction: 'item4',
    pictures: 'userUpload/zzz/zzz-1583055020042,',
    time: '1583331295751',
    availability: 'false',
    matched_id: 1,
    matched_item_id: 5,
  },
  { // item 5
    user_id: 2,
    tags: '#item5',
    title: 'item5',
    status: '全新',
    introduction: 'item5',
    pictures: 'userUpload/我不是彭彭/我不是彭彭-1582369750203,',
    time: '1583331295751',
    availability: 'false',
    matched_id: 1,
    matched_item_id: 4,
  },
  // items 6-8 for triple matched logic test
  { // item 6
    user_id: 1,
    tags: '#item6',
    title: 'item6',
    status: '全新',
    introduction: 'item6',
    pictures: 'userUpload/我不是彭彭/我不是彭彭-1582368916410,userUpload/我不是彭彭/我不是彭彭-1582368916442,userUpload/我不是彭彭/我不是彭彭-1582368916568,userUpload/我不是彭彭/我不是彭彭-1582368916576,',
    time: '1583331295751',
    availability: 'false',
    matched_id: 2,
    matched_item_id: 7,
  },
  { // item 7
    user_id: 2,
    tags: '#item7',
    title: 'item7',
    status: '全新',
    introduction: 'item7',
    pictures: 'userUpload/C2H5OH/C2H5OH-1582601426642,',
    time: '1583331295751',
    availability: 'false',
    matched_id: 2,
    matched_item_id: 8,
  },
  { // item 8
    user_id: 3,
    tags: '#item8',
    title: 'item8',
    status: '全新',
    introduction: 'item8',
    pictures: 'userUpload/C2H5OH/C2H5OH-1582601214771,',
    time: '1583331295751',
    availability: 'false',
    matched_id: 2,
    matched_item_id: 6,
  },
];
const want = [
  // for non-matched want test
  {
    want_item_id: 1,
    required_item_id: 2,
    checked: 'false',
  },
  {
    want_item_id: 2,
    required_item_id: 1,
    checked: 'false',
  },
  {
    want_item_id: 2,
    required_item_id: 3,
    checked: 'false',
  },
  {
    want_item_id: 3,
    required_item_id: 1,
    checked: 'false',
  },
  // for double match test
  {
    want_item_id: 4,
    required_item_id: 5,
    checked: 'confirm',
  },
  {
    want_item_id: 5,
    required_item_id: 4,
    checked: 'confirm',
  },
  // for triple match test
  {
    want_item_id: 6,
    required_item_id: 7,
    checked: 'confirm',
  },
  {
    want_item_id: 7,
    required_item_id: 8,
    checked: 'confirm',
  },
  {
    want_item_id: 8,
    required_item_id: 6,
    checked: 'confirm',
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
    main_category_id: 1,
    sub_category: '其他',
  },
  {
    id: 2,
    main_category_id: 2,
    sub_category: '相機',
  },
  {
    id: 3,
    main_category_id: 3,
    sub_category: '鏡頭',
  },
  {
    id: 4,
    main_category_id: 4,
    sub_category: '底片',
  },
  {
    id: 5,
    main_category_id: 5,
    sub_category: '沖洗用具',
  },
  {
    id: 6,
    main_category_id: 3,
    sub_category: '球棒',
  },
  {
    id: 7,
    main_category_id: 4,
    sub_category: '眼影',
  },
  {
    id: 8,
    main_category_id: 4,
    sub_category: '遮瑕糕',
  },
  {
    id: 9,
    main_category_id: 4,
    sub_category: '化妝水',
  },
  {
    id: 10,
    main_category_id: 4,
    sub_category: '面膜',
  },
  {
    id: 11,
    main_category_id: 5,
    sub_category: '拳套',
  },
  {
    id: 12,
    main_category_id: 5,
    sub_category: '手綁帶',
  },
  {
    id: 13,
    main_category_id: 5,
    sub_category: '護具',
  },
  {
    id: 14,
    main_category_id: 5,
    sub_category: '手靶',
  },
  {
    id: 15,
    main_category_id: 5,
    sub_category: '腿靶',
  },
  {
    id: 16,
    main_category_id: 5,
    sub_category: '訓練用品',
  },
  {
    id: 17,
    main_category_id: 3,
    sub_category: '鞋',
  },
  {
    id: 18,
    main_category_id: 3,
    sub_category: '球衣',
  },
  {
    id: 19,
    main_category_id: 3,
    sub_category: '球員卡',
  },
  {
    id: 20,
    main_category_id: 3,
    sub_category: '紀念品',
  },
  {
    id: 21,
    main_category_id: 4,
    sub_category: '鞋',
  },
  {
    id: 22,
    main_category_id: 4,
    sub_category: '球衣',
  },
  {
    id: 23,
    main_category_id: 4,
    sub_category: '球員卡',
  },
  {
    id: 24,
    main_category_id: 4,
    sub_category: '紀念品',
  },
];

const messages = [
  {
    content: 'test1',
    sender: 'system',
    time: '1582601355567',
    // matched_id: null,
    // mentioned_item_id: null,
    watched: 'false',
    link: '/want/invitation',
    receiver: 1,
  },
];

const matches = [{
  start_item_id:6,
  middle_item_id:7,
  end_item_id:8,
}];

const item_categories = [
  {
    main_category_id:1,
    sub_category:1,
    item_id:1,
  },
  {
    main_category_id:1,
    sub_category:1,
    item_id:2,
  },
  {
    main_category_id:1,
    sub_category:1,
    item_id:3,
  },
  {
    main_category_id:1,
    sub_category:1,
    item_id:4,
  },
  {
    main_category_id:1,
    sub_category:1,
    item_id:5,
  },
  {
    main_category_id:1,
    sub_category:1,
    item_id:6,
  },
  {
    main_category_id:1,
    sub_category:1,
    item_id:7,
  },
  {
    main_category_id:1,
    sub_category:1,
    item_id:8,
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
  item_categories
};