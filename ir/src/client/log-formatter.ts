enum LogLevels {
    error = 0,
    warn = 1,
    info = 2,
    http = 3,
    verbose = 4,
    debug = 5,
    silly = 6
}

export class LogFormatter {

    private logs = null;

    public constructor(stringifiedJson: any) {
        this.logs = stringifiedJson;
    }

    public filter(level = null, file = null): Array<any> {
        let filteredLogs = this.logs;
        if (level)
            filteredLogs = filteredLogs.filter(log => LogLevels[log.level] <= LogLevels[level]);
        if (file)
            filteredLogs = filteredLogs.filter(log => log.message.includes(`[${file}]`));
        return filteredLogs;
    }

}