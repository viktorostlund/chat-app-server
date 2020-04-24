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
    users.push({ id: client.id, userName: null, timer: null });
    const emitMessage = (message, from, self = null) => {
        const sendList = users.slice();
        if (self !== null) {
            sendList.splice(self, 1);
        }
        if (sendList.length > 0) {
            sendList.forEach((user) => {
                if (user.userName) {
                    socket.sockets.connected[user.id].emit('message', {
                        userName: from,
                        message,
                        time: new Date().getTime(),
                    });
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
        const userIndex = getIndex(client.id, users);
        if (users[userIndex] && users[userIndex].userName) {
            emitMessage(`${users[userIndex].userName} was left the chat due to inactivity`, '', userIndex);
        }
        client.emit('logout', 'inactivity');
        logger.manualActions({ action: 'inactivity', id: users[userIndex].id });
        users[userIndex].userName = null;
        users[userIndex].timer = null;
    };
    process.on('SIGINT', () => {
        logoutServerExit();
    });
    process.on('SIGTERM', () => {
        logoutServerExit();
    });
    client.on('message', (msg) => {
        const i = getIndex(client.id, users);
        if (msg.message.length === 0 || msg.message.length > 200) {
            client.emit('message', 'invalid');
            users[i].timer = restartTimer(users[i], timedLogout, timeout);
        }
        else {
            emitMessage(msg.message, msg.userName);
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
            emitMessage(`${users[i].userName} entered the chat`, '');
        }
    });
    client.on('logout', () => {
        const userIndex = getIndex(client.id, users);
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
        const userIndex = getIndex(client.id, users);
        emitMessage(`${users[userIndex].userName} was disconnected`, '', userIndex);
        if (users[userIndex].timer) {
            clearTimeout(users[userIndex].timer);
        }
        users.splice(userIndex, 1);
    });
});
logger.monitor(socket);
//# sourceMappingURL=index.js.map