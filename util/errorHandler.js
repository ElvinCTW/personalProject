function sqlErrLog(err, functionName, fileName) {
  functionName = functionName.substr('function '.length);
  functionName = functionName.substr(0, functionName.indexOf('('));
  console.log(`-------------ERROR START-------------`)
  console.log(`error in ${functionName}, ${fileName}`);
  console.log(err.sqlMessage);
  console.log(err.sql);
  console.log(`--------------ERROR END--------------`)
}

module.exports={
  sqlErrLog,
}