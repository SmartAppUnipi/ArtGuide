/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>


// Mock fs to hide the .env file
jest.mock('fs')
// Remove all previously set env variables
delete process.env.GoogleCustomSearchAPIKey_00
delete process.env.GoogleCustomSearchEngineId_IT_00
delete process.env.GoogleCustomSearchEngineId_EN_00
delete process.env.LoggerLevel
delete process.env.LogFile
delete process.env.DisableLogsOnConsole
// load environment
const environment = require('../../src/environment');


describe(".env", () => {

    test("GoogleSearchConfig", () => {
        expect(environment.GoogleSearchConfig).toBeDefined()
        expect(environment.GoogleSearchConfig.apiKey).toBeUndefined()
        expect(environment.GoogleSearchConfig.searchEngineId).toBeDefined()
        expect(environment.GoogleSearchConfig.searchEngineId.en).toBeUndefined()
        expect(environment.GoogleSearchConfig.searchEngineId.it).toBeUndefined()
    });

    test("LoggerConfig", () => {
        expect(environment.LoggerConfig).toBeDefined()
        expect(environment.LoggerConfig.disableLogsOnConsole).toBeUndefined()
        expect(environment.LoggerConfig.file).toBeUndefined()
        expect(environment.LoggerConfig.level).toBeDefined()
        expect(environment.LoggerConfig.level).toEqual("error")
    });

})


describe("routes.json", () => {

    it("The port should be 3000", () => {
        expect(environment.ExpressPort).toBeDefined()
        expect(environment.ExpressPort).toEqual("3000")
    });

    test("Port", () => {
        expect(environment.AdaptationEndpoint).toBeDefined()
        expect(environment.AdaptationEndpoint.keywords).toBeDefined()
        expect(environment.AdaptationEndpoint.keywords).toEqual("http://localhost:6397/keywords")
        expect(environment.AdaptationEndpoint.text).toBeDefined()
        expect(environment.AdaptationEndpoint.text).toEqual("http://localhost:6397/tailored_text")
    });

})