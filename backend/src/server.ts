import express from "express";

const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
  res.send("Backend rodando 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
});
