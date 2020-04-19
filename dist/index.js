const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
// const fs = require('fs');
// const util = require('util');
// const readFile = util.promisify(fs.readFile);
// const writeFile = util.promisify(fs.writeFile);
const port = 3001;
const users = [];
app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});
io.on('connection', (socket) => {
    // users = JSON.parse(await readFile('users.json'));
    socket.on('message to server', (msg) => {
        console.log('Number of clients: ', io.engine.clientsCount);
        console.log('send message to clients');
        io.emit('message to clients', msg);
    });
    socket.on('logout to server', (username) => {
        io.emit('users to clients after logout', users);
        // delete disconnected user from user list kind of like so:
        // const usersUpdated = users.slice(users.indexOf(user))
        // await writeFile('users.json', JSON.stringify(usersUpdated));
    });
    socket.on('disconnect to server', (username) => {
        io.emit('users to clients after disconnect', '[Server]: Someone was disconnected.');
        // delete disconnected user from user list kind of like so:
        // const usersUpdated = users.slice(users.indexOf(user))
        // await writeFile('users.json', JSON.stringify(usersUpdated));
    });
    socket.on('login to server', (username) => {
        if (users.find(username) === -1) {
            users.push(username);
        }
        io.emit('users to clients after login', users);
        // await writeFile('users.json', JSON.stringify(usersUpdated));
    });
});
http.listen(port, () => {
    console.log('listening on *:3001');
});
//# sourceMappingURL=index.js.map