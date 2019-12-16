import fs from "fs";
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
        winston.format.metadata({ fillExcept: ["message", "level", "timestamp", "label"] })
    ),
    transports: [
    ]
});

if (LoggerConfig.file) {
    
    logger.on("data", log => {
        try {
            if (!fs.existsSync(LoggerConfig.file))
                fs.writeFileSync(LoggerConfig.file, JSON.stringify([]));
            const logFileContents = fs.readFileSync(LoggerConfig.file).toString();
            const currentLogs: Array<any> = JSON.parse(logFileContents);
            currentLogs.push(log);
            fs.writeFileSync(LoggerConfig.file, JSON.stringify(currentLogs, null, 4));
        } catch (ex) {
            /**
             * If you run tests with Logger.level silly or debug and
             * you run the tests without --runInBand (eg npm t),
             * the calls to the logger are made in parallel, and thus
             * you will probably get a console error saying "Unexpected
             * JSON token" or "JSON.parse syntax error". 
             */
            // console.warn("Cannot write log on file: " + log.message, ex);
        }
    });
}

if (LoggerConfig.disableLogsOnConsole) {
    logger.add(new winston.transports.Stream({
        stream: fs.createWriteStream("/dev/null")
    }));
} else {
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
