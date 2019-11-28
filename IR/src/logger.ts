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
        }),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports: [
    ]
});

if (LoggerConfig.file) {
    logger.add(
        new winston.transports.File({
            filename: LoggerConfig.file,
            handleExceptions: true,
            format: winston.format.combine(
                // Render in one line in your log file.
                // If you use prettyPrint() here it will be really
                // difficult to exploit your logs files afterwards.
                winston.format.json({
                    replacer: (key, value) => {
                        if (value instanceof Error)
                            return { message: value.message, stack: value.stack }
                        return value;
                    },
                    space: 4
                })
            )
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
