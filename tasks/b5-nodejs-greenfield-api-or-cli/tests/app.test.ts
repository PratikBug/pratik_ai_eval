import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app, resetStore } from "../src/app.js";

describe("transaction ledger API routes", () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  it("POST /transactions creates a record", async () => {
    const response = await request(app)
      .post("/transactions")
      .send({ amount: "100.50", type: "credit", description: "Opening deposit" })
      .expect(201);

    expect(response.body).toEqual({
      id: 1,
      amount: "100.50",
      type: "credit",
      description: "Opening deposit",
    });
  });

  it("GET /transactions lists created records", async () => {
    await request(app).post("/transactions").send({ amount: "25.00", type: "credit" });
    await request(app).post("/transactions").send({ amount: "10.00", type: "debit" });

    const response = await request(app).get("/transactions").expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].type).toBe("credit");
    expect(response.body[1].type).toBe("debit");
  });

  it("GET /balance reflects credits and debits", async () => {
    await request(app).post("/transactions").send({ amount: "100.00", type: "credit" });
    await request(app).post("/transactions").send({ amount: "30.00", type: "debit" });
    await request(app).post("/transactions").send({ amount: "5.50", type: "credit" });

    const response = await request(app).get("/balance").expect(200);

    expect(response.body).toEqual({ balance: "75.50", currency: "USD" });
  });

  it("POST /transactions rejects invalid amount", async () => {
    await request(app).post("/transactions").send({ amount: "0", type: "credit" }).expect(422);
  });

  it("POST /transactions rejects invalid type", async () => {
    await request(app)
      .post("/transactions")
      .send({ amount: "10.00", type: "transfer" })
      .expect(422);
  });
});
