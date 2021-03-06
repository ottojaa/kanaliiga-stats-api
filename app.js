const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const logger = require("morgan");
require("dotenv").config();
const indexRouter = require("./routes/index");
const apiRouter = require("./routes/api");
const apiResponse = require("./helpers/apiResponse");
const cors = require("cors");

// DB connection
const MONGODB_URL = process.env.MONGODB_URL;
const mongoose = require("mongoose");
mongoose
  .connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    if (process.env.NODE_ENV !== "test") {
      console.log("Connected to %s", MONGODB_URL);
    }
  })
  .catch(err => {
    console.error("App starting error:", err.message);
    process.exit(1);
  });
const db = mongoose.connection;

const app = express();

//don't show the log when it is test
if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

//To allow cross-origin requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
  return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
  if (err.name == "UnauthorizedError") {
    return apiResponse.unauthorizedResponse(res, err.message);
  }
});

module.exports = app;
