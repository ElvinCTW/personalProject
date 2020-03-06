let { getMsgForHeader } = require('../../dao/msgDAO');
let { assert } = require('chai')

describe('getMsgForHeader', () => {
  it('should count as 3', async () => {
    assert.equal(
      await new Promise(async (resolve, reject) => {
        let msgArr = await getMsgForHeader('e72c77f0f6a8b16e5004596f5ff07dd36e7882638491d4b92f6e2b725e74da81').catch(err => reject(err))
        resolve(msgArr.length)
      }), 3)
  })
})