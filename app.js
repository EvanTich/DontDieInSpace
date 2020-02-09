const port = process.env.PORT || 3000;

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var info = {};

class PlayerInfo {
    
    // player general socket
    //socket;
    // private player chat info
    //_chatId; 
    //_nickname;
    // player game info
    //objectId; // should not change after set
    //object;

    constructor(socket) {
        this.socket = socket;
        this._chatId = -1;
        this.objectId = -1;
        this.object = null;
        this._nickname = '';
    }

    get chatId() {
        return this._chatId;
    }

    set chatId(val) {
        this._chatId = val;
        this.onchange();
    }

    get nickname() {
        return this._nickname;
    }

    set nickname(val) {
        console.log(`${this.tag} changed their nickname to ${val}`);
        this._nickname = val;
        this.onchange();
    }

    get tag() {
        if(this.nickname)
            return `${this.nickname}(${this.chatId})`;
        return `${this.chatId}`;
    }

    onchange() {
        if(this.object) {
            this.object.tag = this.tag;
        }
    }
}

const general = io.on('connection', socket => {
    console.log(`general connection by ${socket.id} created by ${socket.handshake.address}`);
    
    info[socket.id] = new PlayerInfo(socket);
    console.log('1');

    socket.on('disconnect', reason => {
        delete info[socket.id];
    });
});

// setup chat and game server
const chat = require('./chat.js').setup(io, info);
const game = require('./game.js').setup(io, info);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/lib', express.static(__dirname + '/lib'));

// required for socket.io
http.listen(port, () => {
    console.log(`listening to port ${port}`);
});