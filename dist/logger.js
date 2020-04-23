const fs = require('fs');
const util = require('util');
const readFile = fs.readFile;
const writeFile = fs.writeFile;
// const readFile = util.promisify(fs.readFile);
// const writeFile = util.promisify(fs.writeFile);
const bufferDuration = 1000;
let clientPrototypeSend = null;
function makeLogger() {
    const logger = {
        stream: process.stdout,
        consoleLog: console.log,
        socketLoggers: [],
        authToken: null,
        logLevel: 0,
        failSilently: true,
        buf: [],
        messageFormatter: null,
        responseFormatter: null,
        socketLoggerSyncer: null,
        flushBuffer: function () {
            if (logger.buf.length) {
                const newArr = logger.buf.map(function (obj) {
                    return JSON.stringify(obj) + '\n';
                });
                logger.stream.write(newArr.join(''), 'utf8');
                readFile('./log.json', 'utf8', (err, result) => {
                    const parsed = JSON.parse(result);
                    // console.log(parsed);
                    if (parsed === null) {
                        // writeFile('./log.json', JSON.stringify(newArr.join('') + '\n'), 'utf8', () => {console.log('Ja')});
                    }
                    else {
                        let newString = '[';
                        for (i = 0; i < parsed.length; i++) {
                            newString += JSON.stringify(parsed[i]) + ',';
                        }
                        newString += `${newArr[0]}]`;
                        // console.log(newString)
                        // console.log(newArray);
                        // console.log(newArr[0]);
                        // const copy = parsed.push('fsdf');
                        // console.log(copy);
                        // console.log(parsed);
                        // console.log(JSON.parse(newArr[0]))
                        // console.log(parsed.push('sdfdf'));
                        writeFile('./log.json', newString, 'utf8', () => { console.log('Ja'); });
                    }
                });
                // await writeFile('./log.json', currentLog.concat(newArr.join('')));
                // logFile.writeFile('loop.json', "id :" + i + " square :" + i * i);
                if (logger.socketLoggers.length > 0) {
                    const count = logger.socketLoggers.length;
                    for (var i = 0; i < count; ++i)
                        logger.socketLoggers[i].send(JSON.stringify(logger.buf));
                }
                logger.buf = [];
            }
        },
        manualActions: function (obj) {
            if (obj.action === 'inactivity') {
                logger.log(['inactivity logout', obj.id]);
            }
            if (obj.action === 'server exit') {
                logger.log(['server exit', obj.id]);
            }
        },
        monitor: function (socket) {
            socket.on('connection', function (client) {
                logger.log(['connect', client.id]);
                client.on('message', function (message) {
                    logger.log([client.id, message]);
                });
                client.on('disconnect', function () {
                    logger.log(['disconnect', client.id]);
                });
                client.on('login', function () {
                    logger.log(['login', client.id]);
                });
                client.on('logout', function () {
                    logger.log(['logout', client.id]);
                });
                client.on('inactive', function () {
                    logger.log(['inactivity disconnect', client.id]);
                });
            });
        },
        // Expects an array
        log: function (msg) {
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
        }
    };
    setInterval(logger.flushBuffer, bufferDuration);
    return logger;
}
function currentTimeToString() {
    var currentTime = new Date();
    let year = currentTime.getFullYear().toString();
    let month = (currentTime.getMonth() + 1).toString();
    let day = currentTime.getDate().toString();
    let hours = currentTime.getHours().toString();
    let minutes = currentTime.getMinutes().toString();
    let seconds = currentTime.getSeconds().toString();
    let ms = currentTime.getMilliseconds().toString();
    if (parseInt(month) < 10) {
        month = '0' + month;
    }
    if (parseInt(day) < 10) {
        day = '0' + day;
    }
    if (parseInt(hours) < 10) {
        hours = '0' + hours;
    }
    if (parseInt(minutes) < 10) {
        minutes = '0' + minutes;
    }
    if (parseInt(seconds) < 10) {
        seconds = '0' + seconds;
    }
    if (parseInt(ms) < 10) {
        ms = '00' + ms;
    }
    if (parseInt(ms) < 100) {
        ms = '0' + ms;
    }
    const timestamp = year + "/" + month + "/" + day + ":" + hours
        + ":" + minutes + ":" + seconds + "." + ms;
    return timestamp;
}
exports.logger = makeLogger();
//# sourceMappingURL=logger.js.map