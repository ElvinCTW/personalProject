const mysql = require('../util/mysql');

module.exports = {
  insert: (matchData)=>{
    return new Promise((resolve,reject)=>{
      let insertWantsArr=[];
      console.log('in matchDAO.insert()');
      console.log(matchArr);
      // mysql.pool.query('INSERT INTO match (want, want_owner, required, required_owner) VALUES ?', [insertMatchArr], (err, insertMatchResult, fields)=>{

      // })
    })
  }
}