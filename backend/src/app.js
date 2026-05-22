const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const categoriesRoutes = require("./routes/categories.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/categories", categoriesRoutes);

app.get("/", (request, response) => {
  return response.json({
    ok: true,
    name: "gestao-financeira-api"
  });
});

module.exports = app;
