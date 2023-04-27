// *** Imports ***
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
require('dotenv').config();

// * Import Functions and Classes *
const {AppHandler} = require("./js/appHandler");


/**
 * Function to handle running server
 */
function main() {

    // *** Server Creation ***
    const app = express();
    const server = http.createServer(app);
    const io = socketio(server);

    // *** Port Settings ***
    const defaultPort = 3000;
    const port = process.env.PORT || defaultPort;

    // *** Express Setup ***
    // * Note the '/..' in the path so the server can access the 'client' directory *
    const publicDirectoryPath = path.join(__dirname, '/../client');
    app.use(express.static(publicDirectoryPath));

    // ** Setup GET **
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/../index.html');
    });


    // ***** Variables *****
    const handler = new AppHandler();

    // ***** SocketIO Events *****
    io.on('connection', function(socket) {
        console.log(`User Connected: [${socket.id}]`);

        // User Disconnection Event
        socket.on('disconnect', function() {
            console.log(`User Disconnected: [${socket.id}]`)
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

        // User Data Call
        socket.on('userData', (data, callback) => {
            handler.getUserInfo(data.appid, data.steamid).then(response => {
                callback(response);
            });
        });

        // User Steam ID Resolution
        socket.on('fetchSteamID', (username, callback) => {
            handler.getUserID(username).then(response => {
                callback(response);
            });
        });
    });


    // ***** Listen to Port ******
    server.listen(port, () => {
        console.log(`Server is up on port ${port}!`);
    })
}


// * Run Main *
if(require.main === module) {
    main();
}



