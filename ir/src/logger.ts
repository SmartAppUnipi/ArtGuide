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
        if (!fs.existsSync(LoggerConfig.file))
            fs.writeFileSync(LoggerConfig.file, JSON.stringify([]));
        const currentLogs: Array<any> = JSON.parse(fs.readFileSync(LoggerConfig.file).toString());
        currentLogs.push(log);
        fs.writeFileSync(LoggerConfig.file, JSON.stringify(currentLogs, null, 4));
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
