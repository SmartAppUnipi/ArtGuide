import winston from 'winston'
import { LoggerLevel } from './environment'

/** 
 * The application logger service. 
 * Writes on:
 * - trace.log file (in IR folder)
 * - console (only if NODE_ENV !== 'production')
 */
const logger = winston.createLogger({
    level: LoggerLevel,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        })),
    transports: [
        new winston.transports.File({
            filename: 'trace.log',
            handleExceptions: true,
            format: winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        })
    ]
});

// If this run is not a production environment, enable logs also on console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
        handleExceptions: true
    }));
}

export {
    logger
}


