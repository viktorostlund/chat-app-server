const app = require('express')(); // eslint-disable-line @typescript-eslint/no-var-requires
const http = require('http').createServer(app);
const socket = require('socket.io')(http); // eslint-disable-line @typescript-eslint/no-var-requires
// const { logger } = require('./utils/logger.ts'); // eslint-disable-line @typescript-eslint/no-var-requires
const { getIndex, restartTimer } = require('./utils/helpers.ts'); // eslint-disable-line @typescript-eslint/no-var-requires
const logger = require('./utils/winston.ts');
const timeout = 60000;
const port = 3001;
const users = [];
exports.server = http.listen(port);
const messageTemplate = {
    status: 'created',
    userName: '',
    message: '',
    time: 0,
    sendToSelf: true,
    sendToOthers: true,
};
socket.on('connection', (client) => {
    users.push({ id: client.id, userName: '', timer: 0 });
    logger.info(`Connected client ${client.id}`);
    const emitMessage = (message) => {
        const sendList = users.slice();
        if (!message.sendToSelf) {
            sendList.splice(getIndex(message.userName, users), 1);
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
            logger.error(`Server shut down while serving clients`);
            throw new Error('Server shut down while serving clients');
        }
        logger.info(`Server shut down`);
        process.exit();
    };
    const timedLogout = () => {
        const i = getIndex(client.id, users);
        if (users[i] && users[i].userName) {
            emitMessage({
                status: 'success',
                message: `${users[i].userName} has left due to inactivity`,
                userName: '',
                sendToSelf: false,
                time: new Date().getTime(),
                sendToOthers: true,
            });
        }
        client.emit('logout', 'inactivity');
        logger.info(`${users[i]} was disconnected due to inactivity`);
        users[i].userName = null;
        users[i].timer = null;
    };
    process.on('SIGINT', () => {
        logoutServerExit();
    });
    process.on('SIGTERM', () => {
        logoutServerExit();
    });
    client.on('message', (userName, message, time) => {
        const i = getIndex(client.id, users);
        const messageToSend = Object.assign(Object.assign({}, messageTemplate), { userName, message, time });
        if (message.length === 0 || message.length > 100) {
            emitMessage(Object.assign(Object.assign({}, messageToSend), { status: 'invalid', sendToOthers: false }));
            logger.info(`Invalid message by ${userName}`);
        }
        else {
            emitMessage(Object.assign(Object.assign({}, messageToSend), { status: 'success' }));
            logger.info(`Message sent by ${userName}`);
        }
        users[i].timer = restartTimer(users[i], timedLogout, timeout);
    });
    client.on('login', (userName) => {
        const i = getIndex(client.id, users);
        const newMessage = {
            status: 'success',
            message: `${userName} joined the chat`,
            userName: '',
            id: i,
            time: new Date().getTime(),
            sendToSelf: true,
            sendToOthers: true,
        };
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
            users[i].timer = restartTimer(users[i], timedLogout, timeout);
            users[i].userName = userName;
            emitMessage(newMessage);
            logger.info(`${userName} joined chat`);
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
                time: new Date().getTime(),
                sendToSelf: false,
                sendToOthers: true,
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
            time: new Date().getTime(),
            sendToSelf: false,
            sendToOthers: true,
        });
        if (users[i].timer) {
            clearTimeout(users[i].timer);
        }
        users.splice(i, 1);
    });
});
// logger.monitor(socket);
//# sourceMappingURL=index.js.map