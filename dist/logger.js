"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const { writeFile, readFile } = fs;
const bufferDuration = 1000;
function currentTimeToString() {
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
function makeLogger() {
    const logger = {
        stream: process.stdout,
        socketLoggers: [],
        failSilently: true,
        buf: [],
        flushBuffer: () => {
            if (logger.buf.length) {
                const newArr = logger.buf.map((obj) => {
                    return `${JSON.stringify(obj)}\n`;
                });
                logger.stream.write(newArr.join(''), 'utf8');
                readFile('./log.json', 'utf8', (err, result) => {
                    const parsed = JSON.parse(result);
                    let newString = '[\n';
                    if (parsed && parsed.length === 0) {
                        newString += `    ${newArr[0]}]`;
                    }
                    else if (parsed) {
                        for (let i = 0; i < parsed.length; i += 1) {
                            newString += `    ${JSON.stringify(parsed[i])},\n`;
                        }
                        newString += `    ${newArr[0]}]`;
                    }
                    writeFile('./log.json', newString, 'utf8', () => null);
                });
                if (logger.socketLoggers.length > 0) {
                    const count = logger.socketLoggers.length;
                    for (let i = 0; i < count; i += 1)
                        logger.socketLoggers[i].send(JSON.stringify(logger.buf));
                }
                logger.buf = [];
            }
        },
        manualActions: (obj) => {
            if (obj.action === 'inactivity') {
                logger.log(['inactivity logout', obj.id]);
            }
            if (obj.action === 'server exit') {
                logger.log(['server exit', obj.id]);
            }
        },
        monitor: (socket) => {
            socket.on('connection', (client) => {
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
        log: (msg) => {
            try {
                if (!Array.isArray(msg))
                    return;
                const timestamp = currentTimeToString();
                msg.unshift(timestamp);
                logger.buf.push(msg);
            }
            catch (ex) {
                if (!logger.failSilently)
                    throw ex;
            }
        },
    };
    setInterval(logger.flushBuffer, bufferDuration);
    return logger;
}
exports.logger = makeLogger();
//# sourceMappingURL=logger.js.map