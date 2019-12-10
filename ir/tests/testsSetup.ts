/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import fs from "fs";
import { LoggerConfig } from "../src/environment";

export default () => {

    // Clear trace.log before run tests
    if (LoggerConfig.file) {
        // delete log file before starting a new execution
        fs.writeFileSync(LoggerConfig.file, JSON.stringify([]));
    }

}