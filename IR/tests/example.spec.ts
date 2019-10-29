import app from "../src/app";
import request from 'supertest';

describe("Index module", () => {

    it("Should return 200 status code", async () => {
        const result = await request(app).get("/");
        expect(result.status).toEqual(200);
    });
    
});