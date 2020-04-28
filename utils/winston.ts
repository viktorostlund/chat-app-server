import winston from 'winston'; // eslint-disable-line @typescript-eslint/no-var-requires

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: './logs/app.log', level: 'info' }),
  ],
});

winstonLogger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
);

module.exports = winstonLogger;
