const { appendFile } = require('fs'); // eslint-disable-line @typescript-eslint/no-var-requires

const bufferDuration = 1000;

function currentTimeToString(): string {
  const currentTime = new Date();
  const year = currentTime.getFullYear().toString();
  let month = (currentTime.getMonth() + 1).toString();
  let day = currentTime.getDate().toString();
  let hours = currentTime.getHours().toString();
  let minutes = currentTime.getMinutes().toString();
  let seconds = currentTime.getSeconds().toString();
  let ms = currentTime.getMilliseconds().toString();

  if (parseInt(month, 10) < 10) {
    month = `0${month}`;
  }
  if (parseInt(day, 10) < 10) {
    day = `0${day}`;
  }
  if (parseInt(hours, 10) < 10) {
    hours = `0${hours}`;
  }
  if (parseInt(minutes, 10) < 10) {
    minutes = `0${minutes}`;
  }
  if (parseInt(seconds, 10) < 10) {
    seconds = `0${seconds}`;
  }
  if (parseInt(ms, 10) < 10) {
    ms = `00${ms}`;
  }
  if (parseInt(ms, 10) < 100) {
    ms = `0${ms}`;
  }

  const timestamp = `${year}/${month}/${day}:${hours}:${minutes}:${seconds}.${ms}`;
  return timestamp;
}

function makeLogger(): object {
  const logger = {
    stream: process.stdout,
    socketLoggers: [],
    failSilently: true,
    buf: [],
    flushBuffer: (): void => {
      if (logger.buf.length) {
        const newArr = logger.buf.map((obj) => {
          return `${JSON.stringify(obj)}\n`;
        });
        logger.stream.write(newArr.join(''), 'utf8');
        appendFile('./log.txt', newArr.join(''), 'utf8', (err, result) => {
        });
        if (logger.socketLoggers.length > 0) {
          const count = logger.socketLoggers.length;
          for (let i = 0; i < count; i += 1)
            logger.socketLoggers[i].send(JSON.stringify(logger.buf));
        }
        logger.buf = [];
      }
    },
    manualActions: (obj): void => {
      if (obj.action === 'inactivity') {
        logger.log(['inactivity logout', obj.id]);
      }
      if (obj.action === 'server exit') {
        logger.log(['server exit', obj.id]);
      }
    },
    monitor: (socket): void => {
      socket.on('connection', (client): void => {
        logger.log(['connect', client.id]);
        client.on('message', (message) => {
          logger.log([client.id, message]);
        });
        client.on('disconnect', () => {
          logger.log(['disconnect', client.id]);
        });
        client.on('login', () => {
          logger.log(['login', client.id]);
        });
        client.on('logout', () => {
          logger.log(['logout', client.id]);
        });
        client.on('inactive', () => {
          logger.log(['inactivity disconnect', client.id]);
        });
      });
    },

    log: (msg): void => {
      try {
        if (!Array.isArray(msg)) return;

        const timestamp = currentTimeToString();
        msg.unshift(timestamp);
        logger.buf.push(msg);
      } catch (ex) {
        if (!logger.failSilently) throw ex;
      }
    },
  };
  setInterval(logger.flushBuffer, bufferDuration);
  return logger;
}

exports.logger = makeLogger();
