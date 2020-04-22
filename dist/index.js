const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3001;
const users = [];
const timeout = 10000;
// app.get('/', (req, res) => {
//   res.send('<h1>Hello world</h1>');
// });
io.on('connection', (client) => {
    users.push({ id: client.id, userName: null, timer: null });
    process.removeAllListeners();
    process.on('SIGINT', () => logoutServerExit());
    process.on('SIGTERM', () => logoutServerExit());
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
        else if (users.some(user => user.userName === userName)) {
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
        ;
    });
    client.on('logout', (userName) => {
        const userIndex = getUserIndex();
        if (users[userIndex].userName) {
            users[userIndex].userName = null;
            if (users[userIndex].timer) {
                clearTimeout(users[userIndex].timer);
                users[userIndex].timer = null;
            }
            client.emit('logout', 'success');
            emitMessage(`${users[userIndex].userName} left the chat`, '', userIndex);
        }
        else {
            client.emit('logout', 'failure');
        }
    });
    client.on('disconnect', () => {
        let userIndex;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === client.id) {
                userIndex = i;
            }
        }
        emitMessage(`${users[userIndex].userName} was disconnected`, '');
        if (users[userIndex].timer) {
            clearTimeout(users[userIndex].timer);
        }
        users.splice(userIndex, 1);
    });
    const timedLogout = () => {
        const userIndex = getUserIndex();
        if (users[userIndex] && users[userIndex].userName) {
            users.forEach(user => {
                if (user.id !== users[userIndex].id) {
                    io.sockets.connected[user.id].emit('message', {
                        userName: 'Server',
                        message: `${users[userIndex].userName} was left the chat due to inactivity`,
                        time: new Date().getTime(),
                    });
                }
            });
            // emitMessage(`${users[userIndex].userName} was left the chat due to inactivity`, '', userIndex);
        }
        client.emit('logout', 'inactivity');
        users[userIndex].userName = null;
        users[userIndex].timer = null;
    };
    const emitMessage = (message, from, self = null) => {
        const sendList = self !== null ? users.slice(self, 1) : users;
        // console.log(sendList);
        sendList.forEach(user => {
            if (user.userName) {
                console.log(user.id);
                console.log(io.sockets.connected);
                io.sockets.connected[user.id].emit('message', {
                    userName: from,
                    message,
                    time: new Date().getTime(),
                });
            }
        });
    };
    const getUserIndex = () => {
        let userIndex;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === client.id) {
                return i;
            }
        }
    };
    const logoutServerExit = () => {
        client.emit('logout', 'error');
        process.removeAllListeners();
    };
});
exports.server = http.listen(port);
//# sourceMappingURL=index.js.map