const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3001;
const users = [];
app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});
io.on('connection', (client) => {
    users.push({ id: client.id });
    // console.log('One new connected user. There are now ', users.length, ' connected users.');
    client.on('message', (msg) => {
        // console.log('Message object: ', msg);
        users.forEach(user => {
            if (user.userName) {
                io.sockets.connected[user.id].emit('message', msg);
            }
        });
    });
    client.on('login', (userName) => {
        if (!userName) {
            client.emit('login', 'empty');
        }
        else if (users.some(user => user.userName === userName)) {
            client.emit('login', 'taken');
        }
        else {
            let userIndex;
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === client.id) {
                    userIndex = i;
                }
            }
            users[userIndex].userName = userName;
            client.emit('login', 'success');
            users.forEach(user => {
                if (user.userName && user.id !== users[userIndex].id) {
                    io.sockets.connected[user.id].emit('message', {
                        userName: 'Server',
                        message: `${users[userIndex].userName} was logged in`,
                        time: new Date().getTime(),
                    });
                }
            });
        }
        ;
    });
    client.on('logout', (userName) => {
        let userIndex;
        let isLoggedIn;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === client.id) {
                isLoggedIn = users[i].userName ? true : false;
                userIndex = i;
            }
        }
        if (isLoggedIn) {
            client.emit('logout', 'success');
            users.forEach(user => {
                if (user.userName) {
                    io.sockets.connected[user.id].emit('message', {
                        userName: 'Server',
                        message: `${users[userIndex].userName} was logged out`,
                        time: new Date().getTime(),
                    });
                }
            });
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
        users.forEach(user => {
            if (user.userName && user.id !== users[userIndex].id) {
                io.sockets.connected[user.id].emit('message', {
                    userName: 'Server',
                    message: `${users[userIndex].userName} was disconnected`,
                    time: new Date().getTime(),
                });
            }
        });
        users.splice(userIndex, 1);
    });
});
exports.server = http.listen(port);
// http.listen(port, () => {
//   console.log(`listening on ${port}`);
// });
//# sourceMappingURL=index.js.map