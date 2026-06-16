import express from "express";
import { ZodError } from "zod";
import { transactionCreateSchema } from "./schemas.js";
import { resetStore, store } from "./store.js";

export const app = express();

app.use(express.json());

export { resetStore };

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/reset", (_req, res) => {
  resetStore();
  res.json({ status: "reset" });
});

app.post("/transactions", (req, res) => {
  try {
    const payload = transactionCreateSchema.parse(req.body);
    const created = store.create(payload);
    res.status(201).json(created);
  } catch (error) {
    sendValidationError(res, error);
  }
});

app.get("/transactions", (_req, res) => {
  res.json(store.listAll());
});

app.get("/balance", (_req, res) => {
  res.json({ balance: store.balance(), currency: "USD" });
});

function sendValidationError(res: express.Response, error: unknown) {
  if (error instanceof ZodError) {
    res.status(422).json({
      detail: error.issues.map((issue) => ({
        type: issue.code,
        loc: ["body", ...issue.path.map(String)],
        msg: issue.message,
      })),
    });
    return;
  }

  res.status(500).json({ error: "Unexpected server error" });
}
