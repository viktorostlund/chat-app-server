"use strict";
// const http = require('http')
Object.defineProperty(exports, "__esModule", { value: true });
// const io = require('./socket.io')
// const server = http.createServer(function(req, res){
// });
// server.listen(8080);
// var socket = io.listen(server);
// socket.on('connection', function(client){
//     client.on('message', function(message) {
// 	});
//     client.on('disconnect', function() {
//     });
// });
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const logger = require('./logger.ts').defaultLogger;
const port = 3001;
const users = [];
const timeout = 10000;
exports.server = http.listen(port);
io.on('connection', (client) => {
    users.push({ id: client.id, userName: null, timer: null });
    process.on('SIGINT', () => {
        logoutServerExit();
        // client.emit('logout', 'error');
    });
    // process.on('SIGTERM', () => {
    //   logger.manualActions({action: 'server exit', id: client.id});
    //   client.emit('logout', 'error');
    //   logoutServerExit();
    // });
    client.on('message', (msg) => {
        const userIndex = getUserIndex();
        emitMessage(msg.message, msg.userName);
        if (users[userIndex] && users[userIndex].timer) {
            clearTimeout(users[userIndex].timer);
        }
        users[userIndex].timer = setTimeout(() => {
            timedLogout();
        }, timeout);
    });
    client.on('login', (userName) => {
        if (!userName) {
            client.emit('login', 'empty');
        }
        else if (userName.length > 10) {
            client.emit('login', 'invalid');
        }
        else if (users.some((user) => user.userName === userName)) {
            client.emit('login', 'taken');
        }
        else {
            const i = getUserIndex();
            users[i].timer = setTimeout(() => {
                timedLogout();
            }, timeout);
            users[i].userName = userName;
            client.emit('login', 'success');
            emitMessage(`${users[i].userName} entered the chat`, '');
        }
    });
    client.on('logout', (userName) => {
        const userIndex = getUserIndex();
        if (users[userIndex].userName) {
            client.emit('logout', 'success');
            emitMessage(`${users[userIndex].userName} left the chat`, '', userIndex);
            users[userIndex].userName = null;
            if (users[userIndex].timer) {
                clearTimeout(users[userIndex].timer);
                users[userIndex].timer = null;
            }
        }
        else {
            client.emit('logout', 'failure');
        }
    });
    client.on('disconnect', () => {
        const userIndex = getUserIndex();
        emitMessage(`${users[userIndex].userName} was disconnected`, '', userIndex);
        if (users[userIndex].timer) {
            clearTimeout(users[userIndex].timer);
        }
        users.splice(userIndex, 1);
    });
    const timedLogout = () => {
        const userIndex = getUserIndex();
        if (users[userIndex] && users[userIndex].userName) {
            users.forEach((user) => {
                if (user.userName && user.id !== users[userIndex].id) {
                    io.sockets.connected[user.id].emit('message', {
                        userName: '',
                        message: `${users[userIndex].userName} left chat due to inactivity`,
                        time: new Date().getTime(),
                    });
                }
            });
            // emitMessage(`${users[userIndex].userName} was left the chat due to inactivity`, '', userIndex);
        }
        client.emit('logout', 'inactivity');
        logger.manualActions({ action: 'inactivity', id: users[userIndex].id });
        users[userIndex].userName = null;
        users[userIndex].timer = null;
    };
    const emitMessage = (message, from, self = null) => {
        const sendList = users.slice();
        if (self !== null) {
            sendList.splice(self, 1);
        }
        if (sendList.length > 0) {
            sendList.forEach((user) => {
                if (user.userName) {
                    io.sockets.connected[user.id].emit('message', {
                        userName: from,
                        message,
                        time: new Date().getTime(),
                    });
                }
            });
        }
    };
    const getUserIndex = () => {
        let userIndex;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === client.id) {
                return i;
            }
        }
        return null;
    };
    const logoutServerExit = () => {
        if (Object.keys(io.sockets.connected).length > 0) {
            throw new Error('Unexpected server error while serving clients');
        }
        process.exit();
        // io.sockets.connected.forEach(socket => {
        //   socket.disconnect();
        // });
        // server.close();
    };
});
logger.logLevel = 2;
logger.authToken = 'my_secret_token_for_the_dashboard_client';
logger.monitor(io);
//# sourceMappingURL=index.js.map