/* eslint-disable no-undef */
const { getWantBetweenItemIds, checkTripleMatch, checkDoubleMatch } = require('../dao/wantDAO');
const { pool } = require('../util/mysql');

describe('want unit test', () => {
  test.each([
    [[1], [2], 1],
    [[1], [3], 0],
    [[2], [1], 1],
  ])('.getWantBetweenItemIds(%o, %o)', async (a, b, expected) => {
    let result = await getWantBetweenItemIds(a, b);
    expect(result.length).toBe(expected);
  });
});

describe('checkTripleMatch', () => {
  // should have no value
  test.each([
    [1, 2, {}],
    [3, 4, {}],
    [6, 5, {}],
  ])('.checkTripleMatch(%i, %i)', async (a, b, expected) => {
    let con = await getCon();
    expect(await checkTripleMatch(a, b, con)).toEqual(expected);
    con.release();
  });
  // should work fine to get 1 result
  test.each([
    [6, 7, 1],
    [7, 8, 1],
    [8, 6, 1],
  ])('.checkTripleMatch(%i, %i,con)', async (a, b) => {
    let con = await getCon();
    let result = await checkTripleMatch(a, b, con);
    expect(result).toHaveProperty('msg');
    expect(result.msg).toBe('tripleConfirmedMatch');
    con.release();
  });
});

describe('checkDoubleMatch', () => {
  // success cases
  test.each([
    [4, 5],
    [5, 4]
  ])('.checkDoubleMatch(%i,%i,con)', async (a, b) => {
    let con = await getCon();
    let result = await checkDoubleMatch(a, b, con);
    expect(result).toHaveProperty('msg');
    expect(result.msg).toEqual('doubleConfirmedMatch');
    con.release();
  });
  // fail cases
  test.each([
    [1, 2],
    [5, 8],
    [11, 6]
  ])('.checkDoubleMatch(%i,%i,con)', async (a, b) => {
    let con = await getCon();
    let result = await checkDoubleMatch(a, b, con);
    expect(result).toEqual({});
    con.release();
  });
  // reject cases
  test.each([
    ['41', 'select'],
    ['5', 'where'],
  ])('.checkDoubleMatch(%i,%s,con)', async (a, b) => {
    let con = await getCon();
    await expect(checkDoubleMatch(a, b)).rejects.toThrow();
    con.release();
  });
});

describe('throw error test', () => {
  test('error case', async () => {
    expect(() => { throwError(); }).toThrow();
  });
});

async function getCon() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if (err) {
        reject(err);
      } else {
        resolve(con);
      }
    });
  });
}

function throwError() {
  throw new Error('wow');
}