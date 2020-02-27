module.exports = {
  init: (server)=>{
    const io = require('socket.io')(server);
    io.on('connection', (socket) => {
      console.log('a user connected');

      io.emit('message', 'hi there')
    
      socket.on('message', (obj)=>{
        // emit到所有user
        console.log(obj);
        io.emit('message', obj)
        // 儲存到db
    
      })
    
      socket.on("disconnect", () => {
        console.log("a user go out");
      });
    
    });
  }
}