import { LoggerConfig } from "./environment";
import winston from "winston";

/**
 * The application logger service.
 */
const logger = winston.createLogger({
    level: LoggerConfig.level,
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        })),
    transports: [
    ]
});

if (LoggerConfig.file) {
    logger.add(
        new winston.transports.File({
            filename: LoggerConfig.file,
            handleExceptions: true,
            format: winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        })
    );
}

if (LoggerConfig.enableLogsOnConsole != "false" || !LoggerConfig.file) {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            handleExceptions: true
        })
    );
}

export default logger;
