/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import { LogFormatter } from "../../client/log-formatter";

const logs = [
  {
    "message": "[file1.ts] A log message.",
    "level": "error",
    "timestamp": "2019-12-10 16:26:58"
  },
  {
    "message": "[file1.ts] Another log message.",
    "level": "warn",
    "timestamp": "2019-12-10 16:26:58"
  },
  {
    "message": "[file2.ts] Google returned no items for query.",
    "level": "error",
    "timestamp": "2019-12-10 16:26:58"
  }
]

describe("File .env", () => {

  const logFormatter = new LogFormatter(JSON.stringify(logs));

  it("Should parse properly the file", () => {
    const filteredLogs = logFormatter.filter()
    expect(filteredLogs).toBeDefined()
    expect(filteredLogs).toEqual(logs)
  });

  it("Should filter by level", () => {
    const filteredLogs = logFormatter.filter("error")
    expect(filteredLogs).toBeDefined()
    expect(filteredLogs).toHaveLength(2)
    filteredLogs.forEach(log => expect(log.level).toEqual("error"));
  });

  it("Should filter by file", () => {
    const filteredLogs = logFormatter.filter(null, "file1.ts")
    expect(filteredLogs).toBeDefined()
    expect(filteredLogs).toHaveLength(2)
    filteredLogs.forEach(log => expect(log.message.substring(0, 10)).toEqual("[file1.ts]"));
  });

  it("Should filter by both level and file", () => {
    const filteredLogs = logFormatter.filter("error", "file1.ts")
    expect(filteredLogs).toBeDefined()
    expect(filteredLogs).toHaveLength(1)
    expect(filteredLogs[0].level).toEqual("error");
    expect(filteredLogs[0].message.substring(0, 10)).toEqual("[file1.ts]");
  });

})