import { app } from "./app.js";

const port = Number(process.env.PORT ?? 8767);

app.listen(port, "127.0.0.1", () => {
  console.log(`B5 transaction ledger listening on http://127.0.0.1:${port}`);
});
