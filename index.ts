const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
// const fs = require('fs');
// const util = require('util');
// const readFile = util.promisify(fs.readFile);
// const writeFile = util.promisify(fs.writeFile);

const port: number = 3001;
const users = [];

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (client) => {
  console.log('a user connected')
  // users = JSON.parse(await readFile('users.json'));

  client.on('message', (msg) => {
    console.log('Number of clients: ', io.engine.clientsCount);
    console.log('Message object: ', msg);
    io.emit('message', msg);
  });

  client.on('logout', (username) => {
    io.emit('users after logout', users);
    // delete disconnected user from user list kind of like so:
    // const usersUpdated = users.slice(users.indexOf(user))
    // await writeFile('users.json', JSON.stringify(usersUpdated));
  });

  client.on('disconnect', (username) => {
    console.log('a user disconnected')
    io.emit(
      'users after disconnect',
      '[Server]: Someone was disconnected.'
    );
    // delete disconnected user from user list kind of like so:
    // const usersUpdated = users.slice(users.indexOf(user))
    // await writeFile('users.json', JSON.stringify(usersUpdated));
  });

  client.on('login', (username) => {
    if (users.find(username) === -1) {
      users.push(username);
    }
    io.emit('users after login', users);
    // await writeFile('users.json', JSON.stringify(usersUpdated));
  });
});

http.listen(port, () => {
  console.log('listening on *:3001');
});
