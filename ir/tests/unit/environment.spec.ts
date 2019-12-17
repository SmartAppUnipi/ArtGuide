/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import * as routesJson from "../../../routes.json";

// Mock fs to hide the .env file
jest.mock('fs')
// Remove all previously set env variables
delete process.env.GoogleCustomSearchAPIKey_00
delete process.env.GoogleCustomSearchEngineId_IT_00
delete process.env.GoogleCustomSearchEngineId_EN_00
delete process.env.GoogleCustomSearchEngineId_EN_KIDS
delete process.env.GoogleCustomSearchEngineId_IT_KIDS
delete process.env.LoggerLevel
delete process.env.LogFile
delete process.env.DisableLogsOnConsole
// load environment
import * as environment from '../../src/environment';


describe("File .env", () => {

    it("Should initialize GoogleSearchConfig", () => {
        expect(environment.GoogleSearchConfig).toBeDefined()
        expect(environment.GoogleSearchConfig.apiKey).toBeUndefined()
        expect(environment.GoogleSearchConfig.searchEngineId).toBeDefined()
        expect(environment.GoogleSearchConfig.searchEngineId.en).toBeUndefined()
        expect(environment.GoogleSearchConfig.searchEngineId.it).toBeUndefined()
        expect(environment.GoogleSearchConfig.searchEngineId.kids).toBeDefined()
        expect(environment.GoogleSearchConfig.searchEngineId.kids.en).toBeUndefined()
        expect(environment.GoogleSearchConfig.searchEngineId.kids.it).toBeUndefined()
    });

    it("Should initialize LoggerConfig", () => {
        expect(environment.LoggerConfig).toBeDefined()
        expect(environment.LoggerConfig.disableLogsOnConsole).toBeUndefined()
        expect(environment.LoggerConfig.file).toBeUndefined()
        expect(environment.LoggerConfig.level).toBeDefined()
        expect(environment.LoggerConfig.level).toEqual("error")
    });

})


describe("routes.json", () => {

    it("Should use port 3000", () => {
        expect(environment.ExpressPort).toBeDefined()
        expect(environment.ExpressPort).toEqual("3000")
    });

    it("Should match exported env variables", () => {
        expect(environment.AdaptationEndpoint).toBeDefined()
        expect(environment.AdaptationEndpoint.keywords).toBeDefined()
        expect(environment.AdaptationEndpoint.keywords).toEqual(routesJson.keywords)
        expect(environment.AdaptationEndpoint.text).toBeDefined()
        expect(environment.AdaptationEndpoint.text).toEqual(routesJson.text)
    });

})