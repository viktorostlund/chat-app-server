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
  users.push({id: client.id})
  console.log('Users connected: ', users)
  // users = JSON.parse(await readFile('users.json'));

  client.on('message', (msg) => {
    console.log('Message object: ', msg);
    io.emit('message', msg);
  });

  client.on('logout', (userName) => {
    io.emit('users after logout', users);
    // delete disconnected user from user list kind of like so:
    // const usersUpdated = users.slice(users.indexOf(user))
    // await writeFile('users.json', JSON.stringify(usersUpdated));
  });

  client.on('disconnect', () => {
    for (let i = 0; i < users.length; i++) {
      if (users[i].userName && users[i].id === client.id) {
        console.log(`a user disconnected: ${users[i].userName} (${client.id})`)
        io.emit('message', {
          userName: 'Server',
          message: `${users[i].userName} was disconnected`,
          time: new Date().getTime(),
        });
      }
    }
    // await writeFile('users.json', JSON.stringify(usersUpdated));
  });

  client.on('login', (userName) => {
    if (!userName) {
      client.emit('users after login', 'empty');
    } else if (users.some(user => user.userName === userName)) {
      console.log('Taken')
      client.emit('users after login', 'taken');
    } else { 
      console.log('Log in user!!')
      for (let i = 0; i < users.length; i++) {
        console.log(users[i].id, client.id)
        if (users[i].id === client.id) {
          users[i].userName = userName;
          client.emit('users after login', 'successful');
          io.emit('message', {
            userName: 'Server',
            message: `${users[i].userName} was connected`,
            time: new Date().getTime(),
          });
        }
      }
    // await writeFile('users.json', JSON.stringify(usersUpdated));
    };
  });
});

http.listen(port, () => {
  console.log('listening on *:3001');
});
