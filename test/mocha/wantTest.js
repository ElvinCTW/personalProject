const { getWantBetweenItemIds, checkTripleMatch, checkDoubleMatch } = require('../../dao/wantDAO')
const { expect } = require('chai');
const { pool } = require('../../util/mysql')

describe('getWantBetweenItemIds', () => {
  it('Should equal to 2', async () => {
    expect(
      await getWantBetweenItemIds(['146'], ['111', '112', '113', '114', '116', '117'])
        .then(result => { return result.length })
    ).to.be.equal(2)
  })
  it('Should equal to 1', async () => {
    expect(
      await getWantBetweenItemIds(['111', '114', '116', '117'], ['146'])
        .then(result => { return result.length })
    ).to.be.equal(1)
  })
})

describe('checkTripleMatch', () => {
  it('should equal to 1', async () => {
    expect(
      await new Promise( async (resolve,reject)=>{
        pool.getConnection(async (err,con)=>{
          if (err) { console.log(err) }
          let result = await checkTripleMatch('223', '111', con);
          if (result.itemC_idArr) {
            con.release()
            resolve(result.itemC_idArr.length)
          } else {
            con.release()
            resolve(999)
          }
        })
      })
    ).to.be.equal(1)
  })
})
