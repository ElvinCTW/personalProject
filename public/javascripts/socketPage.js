socket = io.connect('ws://localhost:3000');
socket.emit('message', 'yo')