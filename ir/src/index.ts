import app from "./app";
import { ExpressPort, LoggerConfig } from "./environment";
import fs from "fs";

if (LoggerConfig.file) {
    // delete log file before starting a new execution
    if (fs.existsSync(LoggerConfig.file)) {
        fs.unlinkSync(LoggerConfig.file);
    }
}

app.listen(ExpressPort, () => {
    // eslint-disable-next-line
    console.log("App listening at http://localhost:" + ExpressPort);
});