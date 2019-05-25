const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const { PORT } = require("./constants");
const productsRoute = require("./routes/productsRoute");

mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true }
);

let db = mongoose.connection;

db.once("open", () => console.log("Connected to MongoDB"));
db.on("error", err => console.log(err));

const app = express();

app.enable("trust proxy");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

app.all("*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Route Files
app.use(productsRoute);

const appPort = process.env.PORT || PORT;
app.listen(appPort, () => console.log(`Success, port ${appPort}!`));
