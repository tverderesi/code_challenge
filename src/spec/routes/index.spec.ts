import request from "supertest";
import express from "express";
import router from "../../routes";

const app = express();
app.use(router);

describe("Index Route", () => {
  it("should return a 200 status code", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  it("should return 'Api is working.' message", async () => {
    const response = await request(app).get("/");
    expect(response.text).toBe("API is working.");
  });
});
