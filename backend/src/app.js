const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (request, response) => {
  return response.json({
    ok: true,
    name: "gestao-financeira-api"
  });
});

module.exports = app;
