const app = require('express')(); // eslint-disable-line @typescript-eslint/no-var-requires
const http = require('http').createServer(app);
const socket = require('socket.io')(http); // eslint-disable-line @typescript-eslint/no-var-requires
const { logger } = require('./logger.ts'); // eslint-disable-line @typescript-eslint/no-var-requires
const getIndex = require('./utils.ts').getUserIndex; // eslint-disable-line @typescript-eslint/no-var-requires
const restartTimer = require('./utils.ts').restartDisconnectTimer; // eslint-disable-line prefer-destructuring
const timeout = 60000;
const port = 3001;
const users = [];
exports.server = http.listen(port);
socket.on('connection', (client) => {
    users.push({ id: client.id, userName: String, timer: Number });
    const emitMessage = (message) => {
        const sendList = users.slice();
        if (!message.sendToSelf) {
            sendList.splice(message.id, 1);
        }
        if (sendList.length > 0) {
            sendList.forEach((user) => {
                if (user.userName) {
                    socket.sockets.connected[user.id].emit('message', message);
                }
            });
        }
    };
    const logoutServerExit = () => {
        if (Object.keys(socket.sockets.connected).length > 0) {
            throw new Error('Unexpected server error while serving clients');
        }
        process.exit();
    };
    const timedLogout = () => {
        const i = getIndex(client.id, users);
        if (users[i] && users[i].userName) {
            emitMessage({
                status: 'success',
                message: `${users[i].userName} was left the chat due to inactivity`,
                userName: '',
                id: i,
                sendToSelf: false,
                time: new Date().getTime()
            });
        }
        client.emit('logout', 'inactivity');
        logger.manualActions({ action: 'inactivity', id: users[i].id });
        users[i].userName = null;
        users[i].timer = null;
    };
    process.on('SIGINT', () => {
        logoutServerExit();
    });
    process.on('SIGTERM', () => {
        logoutServerExit();
    });
    client.on('message', (message) => {
        const i = getIndex(client.id, users);
        if (message.message.length === 0 || message.message.length > 100) {
            client.emit('message', Object.assign(Object.assign({}, message), { status: 'invalid' }));
            users[i].timer = restartTimer(users[i], timedLogout, timeout);
        }
        else {
            emitMessage(Object.assign(Object.assign({}, message), { status: 'success', time: new Date().getTime(), id: i, sendToSelf: true }));
            users[i].timer = restartTimer(users[i], timedLogout, timeout);
        }
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
            const i = getIndex(client.id, users);
            users[i].timer = restartTimer(users[i], timedLogout, timeout);
            users[i].userName = userName;
            client.emit('login', 'success');
            emitMessage({
                status: 'success',
                message: `${users[i].userName} entered the chat`,
                userName: users[i].userName,
                id: i,
                time: new Date().getTime(),
                sendToSelf: true
            });
        }
    });
    client.on('logout', () => {
        const i = getIndex(client.id, users);
        if (users[i].userName) {
            client.emit('logout', 'success');
            emitMessage({
                status: 'success',
                message: `${users[i].userName} left the chat`,
                userName: '',
                id: i,
                time: new Date().getTime(),
                sendToSelf: false
            });
            users[i].userName = null;
            if (users[i].timer) {
                clearTimeout(users[i].timer);
                users[i].timer = null;
            }
        }
        else {
            client.emit('logout', 'failure');
        }
    });
    client.on('disconnect', () => {
        const i = getIndex(client.id, users);
        emitMessage({
            status: 'success',
            message: `${users[i].userName} was disconnected`,
            userName: '',
            id: i,
            time: new Date().getTime(),
            sendToSelf: false
        });
        if (users[i].timer) {
            clearTimeout(users[i].timer);
        }
        users.splice(i, 1);
    });
});
logger.monitor(socket);
//# sourceMappingURL=index.js.map