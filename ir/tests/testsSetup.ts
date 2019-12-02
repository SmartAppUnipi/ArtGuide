/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import fs from "fs";
import { LoggerConfig } from "../src/environment";

export default () => {

    // Clear trace.log before run tests
    if (fs.existsSync(LoggerConfig.file)) {
        fs.writeFileSync(LoggerConfig.file, "");
    }

}