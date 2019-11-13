/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../src/app"


describe("Index module", () => {

    it("Should return 200 status code", async () => {
        const result = await request(app).get("/")
        expect(result.status).toEqual(200)
    })
    
})