const discord = require("discord.js");
const tmi = require('tmi.js');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const prefix = "?"
const sockets = new Set();


require('dotenv').config()


const discordClient = new discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
discordClient.login(process.env.BOT_TOKEN)


discordClient.on("message", async msg => {
  if(!msg.author.bot && msg.content.length > 0 && msg.content.startsWith(prefix) && msg.channel.name == "🔴live-chat"){

    const tags = {};
    tags["display-name"] = msg.member.displayName
    tags["username"] = msg.author.username
    tags["platform"] = "discord"
    const badges = {}
    for(let c of msg.member.roles.cache.array().map((r)=>r.name)){

    
        if(c=="Admin" || c=="Moderator"){
            badges["moderator"]="0";
        }

        if(c=="Streamer"){
            badges["broadcaster"]="0";
        }

        if(c=="Vip"){
            badges["vip"]="0";
        }
        if(c=="Twitch Subscriber"){
            badges["subscriber"]="0";
        }

    }
    tags["badges"] = badges


    const messageNoPrefix = msg.content.substr(1)
        for(const socket of sockets){
            input = {"message":messageNoPrefix, tags};
            socket.emit('message',input);
        }
  }

})


const twitchClient = new tmi.Client({
	connection: {
		secure: true,
		reconnect: true
	},
	channels: [ 'saintplaysthings' ]
});

twitchClient.connect();

twitchClient.on('message', (channel, tags, message, self) => {
    tags["platform"] = "twitch";

    const messageNoPrefix = message.substr(1)
        for(const socket of sockets){
            input = {"message":messageNoPrefix, tags}
            socket.emit('message',input);
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


http.listen(3001, () => {
    console.log('listening on *:3001');
});