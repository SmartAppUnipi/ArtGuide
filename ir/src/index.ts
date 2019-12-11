import app from "./app";
import fs from "fs";
import { ExpressPort, LoggerConfig } from "./environment";

if (LoggerConfig.file) {
    // delete log file before starting a new execution
    fs.writeFileSync(LoggerConfig.file, JSON.stringify([]));
}

app.listen(ExpressPort, () => {
    // eslint-disable-next-line
    console.log("App listening at http://localhost:" + ExpressPort);
});