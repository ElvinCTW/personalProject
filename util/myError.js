/**
 * @param {int} statusCode send to clients
 * @param {string} message log for developers
 */
function MyError(statusCode, message) {
  this.statusCode = statusCode;
  this.name = 'MyError';
  this.message = message;
  this.stack = (new Error()).stack;
}
MyError.prototype = Object.create(Error.prototype);
MyError.prototype.constructor = MyError;

module.exports = MyError;
