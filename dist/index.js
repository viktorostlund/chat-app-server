"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const socketIoModule = require('socket.io'); // eslint-disable-line @typescript-eslint/no-var-requires
const wireUpServer = require('socket.io-fix-close');
const TIMEOUT = 60000;
const PORT = 3001;
const users = [];
const app = express();
const http = app.listen(PORT);
const socketIo = socketIoModule(http);
const logger = require('./utils/winston.ts'); // eslint-disable-line @typescript-eslint/no-var-requires
const { getIndex, restartTimer } = require('./utils/helpers.ts'); // eslint-disable-line @typescript-eslint/no-var-requires
exports.socketIo = socketIo;
wireUpServer(http, socketIo);
const templateMessage = {
    status: 'success',
    userName: '',
    message: null,
    time: null,
    sendToSelf: true,
    sendToOthers: true,
};
socketIo.on('connection', (client) => {
    users.push({ id: client.id, userName: '', timer: null });
    logger.info(`Connected client - ${client.id}`);
    const emitMessage = (message) => {
        const sendList = users.slice();
        if (!message.sendToSelf) {
            sendList.splice(getIndex(message.userName, users), 1);
        }
        if (sendList.length > 0) {
            sendList.forEach((user) => {
                if (socketIo.sockets.connected[user.id] && user.userName) {
                    socketIo.sockets.connected[user.id].emit('message', message);
                }
            });
        }
    };
    const logoutServerExit = () => {
        // if (Object.keys(socketIo.sockets.connected).length > 0) {
        //   logger.error(`Server was shut down while serving clients`);
        //   throw new Error('Server was shut down while serving clients');
        // }
        logger.info(`Server was shut down`);
        socketIo.close();
        http.close();
    };
    const timedLogout = () => {
        const i = getIndex(client.id, users);
        if (users[i] && users[i].userName) {
            emitMessage(Object.assign(Object.assign({}, templateMessage), { message: `${users[i].userName} has left due to inactivity`, sendToSelf: false }));
            logger.info(`${users[i].userName} left chat due to inactivity - ${client.id}`);
            client.emit('logout', 'inactivity');
            users[i].userName = null;
            clearTimeout(users[i].timer);
            users[i].timer = null;
        }
    };
    const sigs = ['SIGINT', 'SIGTERM'];
    sigs.forEach((sig) => process.on(sig, logoutServerExit));
    process.on('SIGINT', () => {
        logoutServerExit();
    });
    client.on('message', (userName, message, time) => {
        const i = getIndex(client.id, users);
        const messageToSend = Object.assign(Object.assign({}, templateMessage), { userName, message, time });
        if (message.length === 0 || message.length > 100) {
            emitMessage(Object.assign(Object.assign({}, messageToSend), { status: 'invalid', sendToOthers: false }));
            logger.info(`Invalid message created by ${userName}`);
        }
        else {
            emitMessage(messageToSend);
            logger.info(`${userName} sent message - ${client.id}`);
        }
        users[i].timer = restartTimer(users[i], timedLogout, TIMEOUT);
    });
    client.on('login', (userName) => {
        const i = getIndex(client.id, users);
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
            client.emit('login', 'success');
            users[i].timer = restartTimer(users[i], timedLogout, TIMEOUT);
            users[i].userName = userName;
            emitMessage(Object.assign(Object.assign({}, templateMessage), { message: `${userName} joined the chat` }));
            logger.info(`${userName} joined chat - ${client.id}`);
        }
    });
    client.on('logout', () => {
        const i = getIndex(client.id, users);
        emitMessage(Object.assign(Object.assign({}, templateMessage), { message: `${users[i].userName} left the chat`, sendToSelf: false }));
        logger.info(`${users[i].userName} left the chat - ${client.id}`);
        users[i].userName = null;
        clearTimeout(users[i].timer);
        users[i].timer = null;
        client.emit('logout', 'success');
    });
    client.on('disconnect', () => {
        const i = getIndex(client.id, users);
        if (users[i].userName) {
            emitMessage(Object.assign(Object.assign({}, templateMessage), { message: `${users[i].userName} was disconnected`, sendToSelf: false }));
            if (users[i].timer) {
                clearTimeout(users[i].timer);
            }
            logger.info(`Client disconnected - ${client.id}`);
            users.splice(i, 1);
        }
    });
});
//# sourceMappingURL=index.js.map