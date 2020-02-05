const mysql = require('../util/mysql');

module.exports = {
  insert: (wantData)=>{
    return new Promise((resolve,reject)=>{
      let insertWantsArr=[];
      console.log(wantData);
      // make insert rows base on wantItemID
      wantData.wantArr = wantData.wantArr.split(',');
      console.log(wantData.wantArr);
      wantData.wantArr.forEach( wantItemID => {
        // make want row
        let wantItemIDInt = parseInt(wantItemID)
        let requiredInt = parseInt(wantData.required)
        let wantRow = [wantItemIDInt, wantData.want_owner, requiredInt, wantData.required_owner];
        // push in arr
        insertWantsArr.push(wantRow)
      });
      console.log(insertWantsArr);
      mysql.pool.query('INSERT INTO want (want, want_owner, required, required_owner) VALUES ?', [insertWantsArr], (err, insertWantResult, fields)=>{
        if (err) {
          console.log('error in insertWantPromise');
          console.log(err.sqlMessage);
          console.log(err.sql);
          reject(err);
        } else {
          console.log(insertWantResult);
          // if success, send back success msg
          resolve({
            msg: `insert success, total ${insertWantResult.affectedRows} rows added`,
          });
          console.log('insert item success');
        }
      })
    });
  }
}