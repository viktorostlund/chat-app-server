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

  const emitMessage = (message, from, id, sendToSelf): void => {
    const sendList = users.slice();
    if (!sendToSelf) {
      sendList.splice(id, 1);
    }
    if (sendList.length > 0) {
      sendList.forEach((user) => {
        if (user.userName) {
          socket.sockets.connected[user.id].emit('message', {
            status: 'sent from server',
            userName: from,
            message,
            time: new Date().getTime(),
          });
        }
      });
    }
  };

  const logoutServerExit = (): void => {
    if (Object.keys(socket.sockets.connected).length > 0) {
      throw new Error('Unexpected server error while serving clients');
    }
    process.exit();
  };

  const timedLogout = (): void => {
    const userIndex = getIndex(client.id, users);
    if (users[userIndex] && users[userIndex].userName) {
      emitMessage(
        `${users[userIndex].userName} was left the chat due to inactivity`,
        '',
        userIndex,
        false
      );
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

  interface Message {
      status: string,
      userName: string,
      message: string,
      time: string,
  }

  client.on('message', (msg: Message) => {
    const i = getIndex(client.id, users);
    if (msg.message.length === 0 || msg.message.length > 100) {
      client.emit('message', { ...msg, status: 'invalid' });
      users[i].timer = restartTimer(users[i], timedLogout, timeout);
    } else {
      emitMessage(msg.message, msg.userName, i, true);
      users[i].timer = restartTimer(users[i], timedLogout, timeout);
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
      const i = getIndex(client.id, users);
      users[i].timer = restartTimer(users[i], timedLogout, timeout);
      users[i].userName = userName;
      client.emit('login', 'success');
      emitMessage(`${users[i].userName} entered the chat`, '', i, true);
    }
  });

  client.on('logout', () => {
    const i = getIndex(client.id, users);
    if (users[i].userName) {
      client.emit('logout', 'success');
      emitMessage(`${users[i].userName} left the chat`, '', i, false);
      users[i].userName = null;
      if (users[i].timer) {
        clearTimeout(users[i].timer);
        users[i].timer = null;
      }
    } else {
      client.emit('logout', 'failure');
    }
  });

  client.on('disconnect', () => {
    const i = getIndex(client.id, users);
    emitMessage(`${users[i].userName} was disconnected`, '', i, false);
    if (users[i].timer) {
      clearTimeout(users[i].timer);
    }
    users.splice(i, 1);
  });
});

logger.monitor(socket);
