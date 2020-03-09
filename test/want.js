const { getWantBetweenItemIds, checkTripleMatch, checkDoubleMatch } = require('../dao/wantDAO')

describe('want unit test',()=>{
  test('getWantBetweenItemIds', async ()=>{
    let result = await getWantBetweenItemIds(['146'], ['111', '112', '113', '114', '116', '117'])
    expect(result.length).toBe(2)
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('want_item_id')
    expect(result[0]).toHaveProperty('required_item_id')
    expect(result[0]).toHaveProperty('required_item_id')
  })
})