var bufferDuration = 1000;

var clientPrototypeSend = null;
function makeLogger() {
    var logger = {
	stream : process.stdout,
	socketLoggers : [],
	authToken : null,
	logLevel : 0,
	failSilently : true,
	buf : [],
	messageFormatter : null,
	responseFormatter : null,
	socketLoggerSyncer : null,
	flushBuffer : function() {
	    if (logger.buf.length) {
		var newArr = logger.buf.map(function(obj) {
		    return JSON.stringify(obj) + '\n';
		});
		logger.stream.write(newArr.join(''), 'utf8');
		if (logger.socketLoggers.length > 0) {
		    var count = logger.socketLoggers.length;
		    for (var i = 0; i < count; ++i)
			logger.socketLoggers[i].send(JSON.stringify(logger.buf));
		}
		logger.buf = [];
	    }
	},
	monitor : function(socket) {
	    var previousBroadcast = socket.broadcast;
	    socket.broadcast = function(message, except) {
		previousBroadcast.apply(socket, [message, except]);
		var parsedMsg = JSON.parse(message);
		logger.log(parsedMsg);
	    };
	    socket.on('connection', function(client) {
		logger.log(['connect', client.id]);
		if (!clientPrototypeSend)
		    clientPrototypeSend = client.send;
		client.send = function(msg) {
		    clientPrototypeSend.apply(client, [msg]);
		    // Don't log heartbeats
		    if (msg.indexOf("~h~") == -1) {
			var parsedMsg = JSON.parse(msg);
			if (logger.responseFormatter)
			    logger.log(["response", client.sessionId, logger.responseFormatter(parsedMsg)]);
			else
			    logger.log(["response", client.sessionId, parsedMsg]);
		    }
		}
		client.on('message', function(message) {
		    try {
			if (logger.logLevel === 0)
			    return;
			var theMessage = ['message'];
			if (message === logger.authToken) {
			    logger.socketLoggers.push(client);
			    client.send = clientPrototypeSend;
			    if (logger.socketLoggerSyncer)
				client.send(logger.socketLoggerSyncer());
			    return;
			}
			
			theMessage.push(client.sessionId);
			if (logger.logLevel == 2) {
			    var parsedMsg = JSON.parse(message);
			    if (logger.messageFormatter) 
				theMessage.push(logger.messageFormatter(parsedMsg));
			    else 
				theMessage.push(parsedMsg);
			}
			logger.log(theMessage);
		    } catch (ex) {
			if (!logger.failSilently)
			    throw ex;
		    }
		});
		client.on('disconnect', function() {
 		    var theSocketLogger = logger.socketLoggers.indexOf(client);
		    if (theSocketLogger != -1)
			logger.socketLoggers.splice(theSocketLogger, 1);
	
		    logger.log(['disconnect', client.sessionId]);
		});
	    });
	},
	
	// Expects an array
	log : function(msg) {
	    try {
		if (!Array.isArray(msg))
		    return;

		const timestamp = currentTimeToString();
		msg.unshift(timestamp);
		logger.buf.push(msg);
	    } catch (ex) {
		if (!logger.failSilently)
		    throw ex;
	    }
	}
    }
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
    const timestamp = year + "/" + month + "/" + day + ":" +  hours 
	+ ":" + minutes + ":" + seconds + "." + ms;
    return timestamp;
}

exports.defaultLogger = makeLogger();
exports.newLogger = makeLogger;