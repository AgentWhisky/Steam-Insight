// *** Imports ***
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const fetch = require("node-fetch");
require('dotenv').config();


// * Import Functions and Classes *
const {AppHandler} = require("./js/appHandler");

// *** Server Creation ***
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// *** Port Settings ***
const defaultPort = 3000;
const port = process.env.PORT || defaultPort;

// *** Path Setup ***
// * Note the '/..' in the path so the server can access the 'client' directory *
const publicDirectoryPath = path.join(__dirname, '/../client');
app.use(express.static(publicDirectoryPath));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/../index.html');
});

// ***** Global Variables *****
handler = new AppHandler();


// ***** SocketIO Events *****
io.on('connection', function(socket) {
    console.log(`User Connected with id: [${socket.id}]`);


    // User Disconnection Event
    socket.on('disconnect', function() {
        console.log(`User Disconnected with id: [${socket.id}]`)
    });

    // User Change Search Event
    socket.on('search', (str, callback) => {
        handler.search(str).then(response => {
            callback(response);
        });
    });

    // User Game Selection
    socket.on('select', (appid, callback) => {
        handler.getAppInfo(appid).then(response => {
            callback(response);
        });
    });
    
});


// ***** Listen to Port ******
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
})



/*  *** Important Info ***
    npm install -save express socket.io dotenv node-fetch@2 mysql2

    add -> "start": "node server/server.js" to scripts

    *** Commands ***
    node server/server.js  -> run server
    or
    npm run start -> run server

    ctrl + c        -> stop server


    *** Testing ***
    http://localhost:3000


*/