const tmi = require('tmi.js');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


const prefix = "?"
const sockets = new Set()

const client = new tmi.Client({
    connection: {
        secure: true,
        reconnect: true
    },
    channels: [ 'saintplaysthings' ]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if(message.startsWith(prefix)){
        const messageNoPrefix = message.substr(1)
        for(socket of sockets){
            input = {"message":messageNoPrefix, tags}
            socket.emit('message',input);
        }
    }
});

io.on('connection', (socket) => {
    sockets.add(socket)
    console.log('a user connected');
    socket.on("disconnect",()=>{
        console.log('a user disconnected');
        sockets.delete(socket)
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
