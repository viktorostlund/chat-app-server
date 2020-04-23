const app = require('express')();
const http = require('http').createServer(app);
let io = require('socket.io')(http);
const logger = require('./logger.ts').logger;

const port = 3001;
const users = [];
const timeout = 10000;
// const LOGGER_AUTH = 'my_secret_token';

exports.server = http.listen(port);

io.on('connection', (client) => {
  users.push({ id: client.id, userName: null, timer: null });

  process.on('SIGINT', () => {
    logoutServerExit();
  });

  process.on('SIGTERM', () => {
    logoutServerExit();
  });

  client.on('message', (msg) => {
    if (msg.message.length === 0 || msg.message.length > 200) {
      client.emit('message', 'invalid');
      const userIndex = getUserIndex();
      if (users[userIndex] && users[userIndex].timer) {
        clearTimeout(users[userIndex].timer);
      }
      users[userIndex].timer = setTimeout(() => {
        timedLogout();
      }, timeout);
    } else {
      const userIndex = getUserIndex();
      emitMessage(msg.message, msg.userName);
      if (users[userIndex] && users[userIndex].timer) {
        clearTimeout(users[userIndex].timer);
      }
      users[userIndex].timer = setTimeout(() => {
        timedLogout();
      }, timeout);
    }
  });

  client.on('login', (userName) => {
    if (!userName) {
      client.emit('login', 'empty');
    } else if (userName.length > 10) {
      client.emit('login', 'invalid');
    } else if (users.some((user) => user.userName === userName)) {
      client.emit('login', 'taken');
    } else {
      const i = getUserIndex();
      users[i].timer = setTimeout(() => {
        timedLogout();
      }, timeout);
      users[i].userName = userName;
      client.emit('login', 'success');
      emitMessage(`${users[i].userName} entered the chat`, '');
    }
  });

  client.on('logout', (userName) => {
    const userIndex = getUserIndex();
    if (users[userIndex].userName) {
      client.emit('logout', 'success');
      emitMessage(`${users[userIndex].userName} left the chat`, '', userIndex);
      users[userIndex].userName = null;
      if (users[userIndex].timer) {
        clearTimeout(users[userIndex].timer);
        users[userIndex].timer = null;
      }
    } else {
      client.emit('logout', 'failure');
    }
  });

  client.on('disconnect', () => {
    const userIndex = getUserIndex();
    emitMessage(`${users[userIndex].userName} was disconnected`, '', userIndex);
    if (users[userIndex].timer) {
      clearTimeout(users[userIndex].timer);
    }
    users.splice(userIndex, 1);
  });

  const timedLogout = () => {
    const userIndex = getUserIndex();
    if (users[userIndex] && users[userIndex].userName) {
      users.forEach((user) => {
        if (user.userName && user.id !== users[userIndex].id) {
          io.sockets.connected[user.id].emit('message', {
            userName: '',
            message: `${users[userIndex].userName} left chat due to inactivity`,
            time: new Date().getTime(),
          });
        }
      });
      // emitMessage(`${users[userIndex].userName} was left the chat due to inactivity`, '', userIndex);
    }
    client.emit('logout', 'inactivity');
    logger.manualActions({ action: 'inactivity', id: users[userIndex].id });
    users[userIndex].userName = null;
    users[userIndex].timer = null;
  };

  const emitMessage = (message, from, self = null) => {
    const sendList = users.slice();
    if (self !== null) {
      sendList.splice(self, 1);
    }
    if (sendList.length > 0) {
      sendList.forEach((user) => {
        if (user.userName) {
          io.sockets.connected[user.id].emit('message', {
            userName: from,
            message,
            time: new Date().getTime(),
          });
        }
      });
    }
  };

  const getUserIndex = () => {
    let userIndex;
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === client.id) {
        return i;
      }
    }
    return null;
  };

  const logoutServerExit = () => {
    if (Object.keys(io.sockets.connected).length > 0) {
      throw new Error('Unexpected server error while serving clients');
    }
    process.exit();
  };
});

logger.logLevel = 2;
// logger.authToken = LOGGER_AUTH;
logger.monitor(io);
