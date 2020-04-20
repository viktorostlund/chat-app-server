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
    users.forEach(user => {
      if (user.userName) {
        io.sockets.connected[user.id].emit('message', msg);
      }
    });
  });

  client.on('logout', (userName) => {
    let userIndex;
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === client.id) {
        userIndex = i;
      }
    }  
    // if (users[userIndex].userName) {
    //   // console.log(`a user logged out: ${users[userIndex].userName} (${client.id})`)
    //   io.emit('message', {
    //     userName: 'Server',
    //     message: `${users[userIndex].userName} logged out`,
    //     time: new Date().getTime(),
    //   });
    // }
    client.emit('users after logout', 'successful');
    users[userIndex].userName = null;
    users.forEach(user => {
      if (user.userName) {
        io.engine.clients[user.id].emit({
          userName: 'Server',
          message: `${users[userIndex].userName} was logged out`,
          time: new Date().getTime(),
        });
      }
    })
    // console.log(users)
  });

  client.on('disconnect', () => {
    let userIndex;
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === client.id) {
        userIndex = i;
      }
    }
    // if (users[userIndex].userName) {
    //   // console.log(`a user disconnected: ${users[userIndex].userName} (${client.id})`)
    //   io.emit('message', {
    //     userName: 'Server',
    //     message: `${users[userIndex].userName} was disconnected`,
    //     time: new Date().getTime(),
    //   });
    // }
    users.splice(userIndex, 1);
    users.forEach(user => {
      if (user.userName) {
        io.engine.clients[user.id].emit({
          userName: 'Server',
          message: `${users[userIndex].userName} was connected`,
          time: new Date().getTime(),
        });
      }
    })
    // console.log(users)
    // await writeFile('users.json', JSON.stringify(usersUpdated));
  });

  client.on('login', (userName) => {
    if (!userName) {
      client.emit('users after login', 'empty');
    } else if (users.some(user => user.userName === userName)) {
      client.emit('users after login', 'taken');
    } else { 
      for (let i = 0; i < users.length; i++) {
        if (users[i].id === client.id) {
          users[i].userName = userName;
          client.emit('users after login', 'successful');
          users.forEach(user => {
            if (user.userName && user.id === client.id) {
              client.emit({
                userName: 'Server',
                message: `${users[i].userName} was logged in`,
                time: new Date().getTime(),
              });
            }
          })
        }
      }
    // await writeFile('users.json', JSON.stringify(usersUpdated));
    };
  });
});

http.listen(port, () => {
  console.log('listening on *:3001');
});
