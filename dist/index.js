const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const port = 3001;
// const users = [ { username: 'Viktor' } ];
app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});
io.on('connection', (socket) => {
    // users = JSON.parse(await readFile('users.json'));
    socket.emit('welcome to clients', 'Welcome someone new!');
    socket.on('message', (msg) => {
        console.log(`message received from user: ${msg.from}`);
        console.log(`message received content: ${msg.content}`);
        io.emit('message to clients', msg);
    });
    socket.on('disconnect', () => {
        io.emit('users after disconnect to clients', '[Server]: Someone was disconnected.');
        // delete disconnected user from user list kind of like so:
        // const usersUpdated = users.slice(users.indexOf(user))
        // await writeFile('users.json', JSON.stringify(usersUpdated));
    });
    socket.on('connect', () => {
        io.emit('users after connect to clients', '[Server]: Someone was connected.');
        // add connected user from user list if not already in users list kind of like so:
        // const usersUpdated = users.push(user)
        // await writeFile('users.json', JSON.stringify(usersUpdated));
    });
});
http.listen(port, () => {
    console.log('listening on *:3001');
});
//# sourceMappingURL=index.js.map